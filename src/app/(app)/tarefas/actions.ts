"use server";

import { revalidatePath } from "next/cache";

import {
  TASK_PRIORITY,
  TASK_STATUS,
  type TaskInput,
  type TaskStatusReal,
} from "@/app/(app)/tarefas/task-constants";
import { can } from "@/lib/auth/roles";
import { getUser } from "@/lib/supabase/auth";
import { createClient, createUntypedClient } from "@/lib/supabase/server";

async function guard() {
  if (!(await can("tarefas.manage"))) {
    throw new Error("Sem permissão para gerir tarefas.");
  }
}

export async function saveTask(input: TaskInput) {
  await guard();
  if (!input.title.trim()) throw new Error("Título é obrigatório.");
  if (!TASK_STATUS.includes(input.status)) throw new Error("Status inválido.");
  if (!TASK_PRIORITY.includes(input.priority))
    throw new Error("Prioridade inválida.");

  const user = await getUser();
  const supabase = await createClient();
  // briefing (coluna nova da 0011) ainda não está nos tipos gerados
  const db = await createUntypedClient();

  const row = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    briefing: input.briefing?.trim() || null,
    status: input.status,
    priority: input.priority,
    client_id: input.clientId || null,
    due_date: input.dueDate || null,
    drive_link: input.driveLink?.trim() || null,
    figma_link: input.figmaLink?.trim() || null,
    assigned_to: input.assignees[0] ?? null,
    updated_at: new Date().toISOString(),
  };

  let taskId = input.id;
  if (taskId) {
    const { error } = await db.from("tasks").update(row).eq("id", taskId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await db
      .from("tasks")
      .insert({ ...row, created_by: user?.id ?? null })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    taskId = (data as { id: string }).id;
  }

  const { data: current } = await supabase
    .from("task_assignees")
    .select("user_id")
    .eq("task_id", taskId);
  const currentIds = new Set((current ?? []).map((r) => r.user_id));
  const wanted = new Set(input.assignees);

  const toAdd = [...wanted].filter((u) => !currentIds.has(u));
  const toRemove = [...currentIds].filter((u) => !wanted.has(u));

  if (toRemove.length) {
    await supabase
      .from("task_assignees")
      .delete()
      .eq("task_id", taskId)
      .in("user_id", toRemove);
  }
  if (toAdd.length) {
    await supabase.from("task_assignees").insert(
      toAdd.map((user_id) => ({
        task_id: taskId!,
        user_id,
        assigned_by: user?.id ?? null,
      })),
    );
  }

  await reconcileSubtasks(supabase, taskId!, input.subtasks ?? [], user?.id ?? null);

  revalidatePath("/tarefas");
}

type Db = Awaited<ReturnType<typeof createClient>>;

/** Sincroniza as subtarefas do form com a tabela subtasks (add / update / remove). */
async function reconcileSubtasks(
  supabase: Db,
  taskId: string,
  wanted: { id?: string; title: string; done: boolean }[],
  userId: string | null,
) {
  const clean = wanted
    .map((s) => ({ ...s, title: s.title.trim() }))
    .filter((s) => s.title.length > 0);

  const { data: existing } = await supabase
    .from("subtasks")
    .select("id, title, status")
    .eq("parent_task_id", taskId);
  const byId = new Map(
    (existing ?? []).map((r) => [r.id as string, r as { id: string; title: string; status: string }]),
  );
  const keepIds = new Set(clean.filter((s) => s.id).map((s) => s.id as string));

  const toDelete = [...byId.keys()].filter((id) => !keepIds.has(id));
  if (toDelete.length) {
    await supabase.from("subtasks").delete().in("id", toDelete);
  }

  const now = new Date().toISOString();
  const toInsert = clean
    .filter((s) => !s.id || !byId.has(s.id))
    .map((s) => ({
      parent_task_id: taskId,
      title: s.title,
      status: s.done ? "completed" : "pending",
      priority: "medium",
      completed_at: s.done ? now : null,
      created_by: userId,
    }));
  if (toInsert.length) {
    await supabase.from("subtasks").insert(toInsert);
  }

  for (const s of clean) {
    if (!s.id) continue;
    const prev = byId.get(s.id);
    if (!prev) continue;
    const nextStatus = s.done ? "completed" : "pending";
    if (prev.title === s.title && prev.status === nextStatus) continue;
    await supabase
      .from("subtasks")
      .update({
        title: s.title,
        status: nextStatus,
        completed_at: s.done ? now : null,
        updated_at: now,
      })
      .eq("id", s.id);
  }
}

export async function moveTaskStatus(id: string, status: TaskStatusReal) {
  await guard();
  if (!TASK_STATUS.includes(status)) throw new Error("Status inválido.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

export async function deleteTask(id: string) {
  await guard();
  const supabase = await createClient();
  await supabase.from("task_assignees").delete().eq("task_id", id);
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}
