"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/lib/auth/roles";
import { getUser } from "@/lib/supabase/auth";
import { createUntypedClient } from "@/lib/supabase/server";

async function guard() {
  if (!(await can("pipeline.manage"))) {
    throw new Error("Sem permissão para gerir o pipeline.");
  }
}

/** Edita o rascunho (assunto/corpo) antes de aprovar — não sai do status draft. */
export async function updateOutreachDraft(
  id: string,
  fields: { subject?: string; body?: string; to_email?: string },
) {
  await guard();
  const db = await createUntypedClient();
  const patch: Record<string, string> = { updated_at: new Date().toISOString() };
  if (fields.subject !== undefined) patch.subject = fields.subject.trim();
  if (fields.body !== undefined) patch.body = fields.body.trim();
  if (fields.to_email !== undefined) patch.to_email = fields.to_email.trim();
  const { error } = await db
    .from("outreach_messages")
    .update(patch)
    .eq("id", id)
    .eq("status", "draft");
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}

/** Aprova — a rotina cloud (Gmail MCP) pega daqui e envia de fato. */
export async function approveOutreachMessage(id: string) {
  await guard();
  const user = await getUser();
  const db = await createUntypedClient();
  const { error } = await db
    .from("outreach_messages")
    .update({
      status: "approved",
      approved_by: user?.id ?? null,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "draft");
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}

export async function rejectOutreachMessage(id: string) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db
    .from("outreach_messages")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["draft", "approved"]);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}

/** Volta uma rejeitada/falha pra rascunho, caso o Guilherme mude de ideia. */
export async function reopenOutreachMessage(id: string) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db
    .from("outreach_messages")
    .update({ status: "draft", error: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["rejected", "failed"]);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}
