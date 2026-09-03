"use server";

import { revalidatePath } from "next/cache";

import {
  STATUS_COLORS,
  TASK_PRIORITY,
  type TaskInput,
} from "@/app/(app)/tarefas/task-constants";
import { can } from "@/lib/auth/roles";
import { getUser } from "@/lib/supabase/auth";
import { createClient, createUntypedClient } from "@/lib/supabase/server";

async function guard() {
  if (!(await can("tarefas.manage"))) {
    throw new Error("Sem permissão para gerir tarefas.");
  }
}

type Db = Awaited<ReturnType<typeof createClient>>;

/** Nomes de coluna válidos (task_statuses.name) — a fonte de verdade do 3b. */
async function statusNames(supabase: Db): Promise<Set<string>> {
  const { data } = await supabase.from("task_statuses").select("name");
  return new Set((data ?? []).map((r) => r.name as string));
}

export async function saveTask(input: TaskInput) {
  await guard();
  if (!input.title.trim()) throw new Error("Título é obrigatório.");
  if (!TASK_PRIORITY.includes(input.priority))
    throw new Error("Prioridade inválida.");

  const user = await getUser();
  const supabase = await createClient();
  // briefing (coluna nova da 0011) ainda não está nos tipos gerados
  const db = await createUntypedClient();

  if (!(await statusNames(supabase)).has(input.status)) {
    throw new Error("Coluna (status) inexistente.");
  }

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

export async function moveTaskStatus(id: string, status: string) {
  await guard();
  const supabase = await createClient();
  if (!(await statusNames(supabase)).has(status)) {
    throw new Error("Coluna (status) inexistente.");
  }
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

/* ------------------------------------------------------------------ *
 * Ações em lote (3e)
 * ------------------------------------------------------------------ */

export async function bulkMoveStatus(ids: string[], status: string) {
  await guard();
  const clean = [...new Set(ids)].filter(Boolean);
  if (clean.length === 0) return;
  const supabase = await createClient();
  if (!(await statusNames(supabase)).has(status)) {
    throw new Error("Coluna (status) inexistente.");
  }
  const { error } = await supabase
    .from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", clean);
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

export async function bulkDelete(ids: string[]) {
  await guard();
  const clean = [...new Set(ids)].filter(Boolean);
  if (clean.length === 0) return;
  const supabase = await createClient();
  await supabase.from("task_assignees").delete().in("task_id", clean);
  await supabase.from("subtasks").delete().in("parent_task_id", clean);
  const { error } = await supabase.from("tasks").delete().in("id", clean);
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

/** Arquiva em lote (archived=true). alsoComplete também move pra "completed". */
export async function bulkArchive(ids: string[], alsoComplete = false) {
  await guard();
  const clean = [...new Set(ids)].filter(Boolean);
  if (clean.length === 0) return;
  const supabase = await createClient();
  const db = await createUntypedClient(); // archived não está nos tipos gerados

  const patch: Record<string, unknown> = {
    archived: true,
    updated_at: new Date().toISOString(),
  };
  if (alsoComplete && (await statusNames(supabase)).has("completed")) {
    patch.status = "completed";
  }
  const { error } = await db.from("tasks").update(patch).in("id", clean);
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

export async function setArchived(id: string, archived: boolean) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db
    .from("tasks")
    .update({ archived, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

/* ------------------------------------------------------------------ *
 * Colunas do Kanban (task_statuses) — CRUD (3b). tasks.status guarda
 * o `name`, então renomear/excluir precisa cascatear em tasks.
 * ------------------------------------------------------------------ */

function cleanName(raw: string) {
  return raw.trim().replace(/\s+/g, " ").slice(0, 40);
}

export async function createStatus(name: string, color: string) {
  await guard();
  const nome = cleanName(name);
  if (!nome) throw new Error("Nome da coluna é obrigatório.");
  if (!STATUS_COLORS.includes(color as (typeof STATUS_COLORS)[number])) {
    color = "slate";
  }
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("task_statuses")
    .select("name, position");
  if ((rows ?? []).some((r) => r.name.toLowerCase() === nome.toLowerCase())) {
    throw new Error("Já existe uma coluna com esse nome.");
  }
  const nextPos =
    Math.max(0, ...(rows ?? []).map((r) => r.position ?? 0)) + 1;
  const { error } = await supabase
    .from("task_statuses")
    .insert({ name: nome, color, position: nextPos, is_default: false });
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

export async function renameStatus(id: string, name: string) {
  await guard();
  const nome = cleanName(name);
  if (!nome) throw new Error("Nome da coluna é obrigatório.");
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("task_statuses")
    .select("id, name");
  const alvo = (rows ?? []).find((r) => r.id === id);
  if (!alvo) throw new Error("Coluna não encontrada.");
  if (alvo.name === nome) return;
  if (
    (rows ?? []).some(
      (r) => r.id !== id && r.name.toLowerCase() === nome.toLowerCase(),
    )
  ) {
    throw new Error("Já existe uma coluna com esse nome.");
  }
  const { error } = await supabase
    .from("task_statuses")
    .update({ name: nome, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  // cascata: tasks guardam o name
  await supabase
    .from("tasks")
    .update({ status: nome, updated_at: new Date().toISOString() })
    .eq("status", alvo.name);
  revalidatePath("/tarefas");
}

export async function setStatusColor(id: string, color: string) {
  await guard();
  if (!STATUS_COLORS.includes(color as (typeof STATUS_COLORS)[number])) {
    throw new Error("Cor inválida.");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("task_statuses")
    .update({ color, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

export async function moveStatus(id: string, dir: "up" | "down") {
  await guard();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("task_statuses")
    .select("id, position")
    .order("position");
  const list = rows ?? [];
  const i = list.findIndex((r) => r.id === id);
  if (i < 0) throw new Error("Coluna não encontrada.");
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return;
  const a = list[i]!;
  const b = list[j]!;
  await supabase
    .from("task_statuses")
    .update({ position: b.position, updated_at: new Date().toISOString() })
    .eq("id", a.id);
  await supabase
    .from("task_statuses")
    .update({ position: a.position, updated_at: new Date().toISOString() })
    .eq("id", b.id);
  revalidatePath("/tarefas");
}

export async function deleteStatus(id: string, reassignToName: string) {
  await guard();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("task_statuses")
    .select("id, name, is_default");
  const list = rows ?? [];
  if (list.length <= 1) throw new Error("Precisa haver ao menos uma coluna.");
  const alvo = list.find((r) => r.id === id);
  if (!alvo) throw new Error("Coluna não encontrada.");

  const destino = list.find((r) => r.id !== id && r.name === reassignToName);
  if (!destino) throw new Error("Escolha uma coluna de destino válida.");

  // move as tasks da coluna pra o destino, depois apaga a coluna
  const { error: upErr } = await supabase
    .from("tasks")
    .update({ status: destino.name, updated_at: new Date().toISOString() })
    .eq("status", alvo.name);
  if (upErr) throw new Error(upErr.message);

  const { error } = await supabase.from("task_statuses").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (alvo.is_default) {
    await supabase
      .from("task_statuses")
      .update({ is_default: true })
      .eq("id", destino.id);
  }
  revalidatePath("/tarefas");
}
