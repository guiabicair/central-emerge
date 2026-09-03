"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/lib/auth/roles";
import { getUser } from "@/lib/supabase/auth";
import { createUntypedClient } from "@/lib/supabase/server";

async function guard() {
  if (!(await can("tarefas.manage"))) {
    throw new Error("Sem permissão para gerir tarefas.");
  }
}

/* --------------------------- Comentários --------------------------- */

export async function addComment(taskId: string, content: string) {
  await guard();
  const text = content.trim();
  if (!text) throw new Error("Comentário vazio.");
  const user = await getUser();
  const db = await createUntypedClient();
  const { error } = await db.from("task_comments").insert({
    task_id: taskId,
    user_id: user?.id ?? null,
    content: text,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

export async function deleteComment(id: string) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db.from("task_comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

/* --------------------------- Entregas ----------------------------- */

export async function submitDelivery(
  taskId: string,
  driveUrl: string,
  description: string,
) {
  await guard();
  const user = await getUser();
  const db = await createUntypedClient();
  const { error } = await db.from("task_deliveries").insert({
    task_id: taskId,
    submitted_by: user?.id ?? null,
    drive_folder_url: driveUrl.trim() || null,
    description: description.trim() || null,
    status: "submitted",
    submitted_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

export async function reviewDelivery(
  id: string,
  approve: boolean,
  feedback: string,
) {
  await guard();
  const user = await getUser();
  const db = await createUntypedClient();
  const { error } = await db
    .from("task_deliveries")
    .update({
      status: approve ? "approved" : "changes_requested",
      feedback: feedback.trim() || null,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

export async function deleteDelivery(id: string) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db.from("task_deliveries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

/* --------------------------- Cronômetro --------------------------- */

/** Inicia um timer na task. Para qualquer outro timer ativo do usuário. */
export async function startTimer(taskId: string) {
  await guard();
  const user = await getUser();
  if (!user) throw new Error("Sessão expirada.");
  const db = await createUntypedClient();

  await db
    .from("time_entries")
    .update({ is_active: false, end_time: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("is_active", true);

  const { error } = await db.from("time_entries").insert({
    task_id: taskId,
    user_id: user.id,
    start_time: new Date().toISOString(),
    is_active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

export async function stopTimer(entryId: string) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db
    .from("time_entries")
    .update({
      is_active: false,
      end_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", entryId);
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

/* --------------------------- Templates --------------------------- */

interface TemplateInput {
  title: string;
  description: string;
  estimatedHours: number | null;
  priority: string;
}

export async function createTemplate(input: TemplateInput) {
  await guard();
  const title = input.title.trim();
  if (!title) throw new Error("Título do template é obrigatório.");
  const user = await getUser();
  const db = await createUntypedClient();
  const { error } = await db.from("task_templates").insert({
    title,
    description: input.description.trim() || null,
    estimated_hours: input.estimatedHours,
    priority: ["low", "medium", "high", "urgent"].includes(input.priority)
      ? input.priority
      : "medium",
    created_by: user?.id ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

export async function deleteTemplate(id: string) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db.from("task_templates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}

/** Cria uma task nova a partir de um template, na coluna indicada. */
export async function createTaskFromTemplate(
  templateId: string,
  status: string,
) {
  await guard();
  const user = await getUser();
  const db = await createUntypedClient();

  const { data: tpl, error: tplErr } = await db
    .from("task_templates")
    .select("title, description, priority")
    .eq("id", templateId)
    .single();
  if (tplErr || !tpl) throw new Error(tplErr?.message ?? "Template não achado.");

  const names = await db.from("task_statuses").select("name");
  const valid = new Set((names.data ?? []).map((r: { name: string }) => r.name));
  const col = valid.has(status)
    ? status
    : ((names.data ?? [])[0]?.name ?? "pending");

  const t = tpl as { title: string; description: string | null; priority: string };
  const { error } = await db.from("tasks").insert({
    title: t.title,
    description: t.description,
    status: col,
    priority: t.priority,
    created_by: user?.id ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/tarefas");
}
