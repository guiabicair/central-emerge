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
import { createClient } from "@/lib/supabase/server";

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

  const row = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
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
    const { error } = await supabase.from("tasks").update(row).eq("id", taskId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...row, created_by: user?.id ?? null })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    taskId = data.id;
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

  revalidatePath("/tarefas");
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
