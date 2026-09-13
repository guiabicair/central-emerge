"use server";

import { revalidatePath } from "next/cache";

import {
  LEAD_FRENTE,
  LEAD_UNIDADE,
  STATUS_COLORS,
  type LeadInput,
} from "@/app/(app)/pipeline/lead-constants";
import { can } from "@/lib/auth/roles";
import { getUser } from "@/lib/supabase/auth";
import { createUntypedClient } from "@/lib/supabase/server";

async function guard() {
  if (!(await can("pipeline.manage"))) {
    throw new Error("Sem permissão para gerir o pipeline.");
  }
}

type Db = Awaited<ReturnType<typeof createUntypedClient>>;

function cleanName(raw: string) {
  return raw.trim().replace(/\s+/g, " ");
}

/** Nomes de coluna válidos (lead_statuses.name) — texto livre desde a 0026. */
async function statusNames(supabase: Db): Promise<Set<string>> {
  const { data } = await supabase.from("lead_statuses").select("name");
  return new Set((data ?? []).map((r) => r.name as string));
}

export async function saveLead(input: LeadInput) {
  await guard();
  if (!input.empresa.trim()) throw new Error("Empresa é obrigatória.");
  if (!LEAD_FRENTE.includes(input.frente)) throw new Error("Frente inválida.");
  if (!LEAD_UNIDADE.includes(input.unidade)) throw new Error("Unidade inválida.");

  const supabase = await createUntypedClient();
  if (!(await statusNames(supabase)).has(input.status)) {
    throw new Error("Estágio inválido.");
  }

  const row = {
    empresa: input.empresa.trim(),
    unidade: input.unidade,
    frente: input.frente,
    segmento: input.segmento?.trim() || null,
    contato: input.contato?.trim() || null,
    origem: input.origem?.trim() || null,
    valor_estimado: Number.isFinite(input.valor_estimado)
      ? Math.max(0, Number(input.valor_estimado))
      : 0,
    responsavel: input.responsavel?.trim() || null,
    status: input.status,
    motivo_fit: input.motivo_fit?.trim() || null,
    proposta_slug: input.proposta_slug?.trim() || null,
    atualizado_em: new Date().toISOString(),
  };

  const { error } = input.id
    ? await supabase.from("vendas_leads").update(row).eq("id", input.id)
    : await supabase.from("vendas_leads").insert(row);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}

export async function moveLeadStage(id: number, status: string) {
  await guard();
  const supabase = await createUntypedClient();
  if (!(await statusNames(supabase)).has(status)) {
    throw new Error("Estágio inválido.");
  }
  const { error } = await supabase
    .from("vendas_leads")
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}

export async function deleteLead(id: number) {
  await guard();
  const supabase = await createUntypedClient();
  const { error } = await supabase.from("vendas_leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}

/** Vincula (ou desvincula) a proposta de um lead pelo slug. */
export async function linkProposta(id: number, slug: string) {
  await guard();
  const supabase = await createUntypedClient();
  const { error } = await supabase
    .from("vendas_leads")
    .update({
      proposta_slug: slug.trim() || null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}

/**
 * Fecha o negócio: move o lead pra 'proposta_aprovada' e cria um registro
 * mínimo em clients (nome/segmento/contato do lead, is_seed=false).
 * Versão mínima do 'Ganhar negócio' — só o cliente, sem contrato/cobrança.
 */
export async function closeDealCreateClient(id: number) {
  await guard();
  const user = await getUser();
  const supabase = await createUntypedClient();

  const { data: lead, error: readErr } = await supabase
    .from("vendas_leads")
    .select("id, empresa, segmento, contato, status")
    .eq("id", id)
    .single();
  if (readErr || !lead) throw new Error(readErr?.message ?? "Lead não achado.");

  // cliente já existe com esse nome? (evita duplicar em confirmação dupla)
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .ilike("name", lead.empresa.trim())
    .limit(1);

  if (!existing?.length) {
    const { error: insErr } = await supabase.from("clients").insert({
      name: lead.empresa.trim(),
      segment: lead.segmento?.trim() || null,
      contact_name: lead.contato?.trim() || null,
      status: "active",
      // negócio fechado = cliente real → entra na lista/dropdown padrão
      is_seed: true,
      mrr: 0,
      created_by: user?.id ?? null,
    });
    if (insErr) throw new Error(insErr.message);
  }

  const { error: mvErr } = await supabase
    .from("vendas_leads")
    .update({
      status: "proposta_aprovada",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);
  if (mvErr) throw new Error(mvErr.message);

  revalidatePath("/pipeline");
  revalidatePath("/clientes");
  return { clientCreated: !existing?.length };
}

/* ------------------------------------------------------------------ *
 * Colunas do Pipeline (lead_statuses) — mesmo padrão de tarefas/actions.ts
 * ------------------------------------------------------------------ */

export async function createStatus(name: string, color: string) {
  await guard();
  const nome = cleanName(name);
  if (!nome) throw new Error("Nome da coluna é obrigatório.");
  if (!STATUS_COLORS.includes(color as (typeof STATUS_COLORS)[number])) {
    color = "slate";
  }
  const supabase = await createUntypedClient();
  const { data: rows } = await supabase
    .from("lead_statuses")
    .select("name, position");
  if ((rows ?? []).some((r) => r.name.toLowerCase() === nome.toLowerCase())) {
    throw new Error("Já existe uma coluna com esse nome.");
  }
  const nextPos = Math.max(0, ...(rows ?? []).map((r) => r.position ?? 0)) + 1;
  const { error } = await supabase
    .from("lead_statuses")
    .insert({ name: nome, color, position: nextPos, is_default: false });
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}

export async function renameStatus(id: string, name: string) {
  await guard();
  const nome = cleanName(name);
  if (!nome) throw new Error("Nome da coluna é obrigatório.");
  const supabase = await createUntypedClient();
  const { data: rows } = await supabase.from("lead_statuses").select("id, name");
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
    .from("lead_statuses")
    .update({ name: nome, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  // cascata: vendas_leads guarda o name
  await supabase
    .from("vendas_leads")
    .update({ status: nome, atualizado_em: new Date().toISOString() })
    .eq("status", alvo.name);
  revalidatePath("/pipeline");
}

export async function setStatusColor(id: string, color: string) {
  await guard();
  if (!STATUS_COLORS.includes(color as (typeof STATUS_COLORS)[number])) {
    throw new Error("Cor inválida.");
  }
  const supabase = await createUntypedClient();
  const { error } = await supabase
    .from("lead_statuses")
    .update({ color, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}

export async function moveStatus(id: string, dir: "up" | "down") {
  await guard();
  const supabase = await createUntypedClient();
  const { data: rows } = await supabase
    .from("lead_statuses")
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
    .from("lead_statuses")
    .update({ position: b.position, updated_at: new Date().toISOString() })
    .eq("id", a.id);
  await supabase
    .from("lead_statuses")
    .update({ position: a.position, updated_at: new Date().toISOString() })
    .eq("id", b.id);
  revalidatePath("/pipeline");
}

export async function deleteStatus(id: string, reassignToName: string) {
  await guard();
  const supabase = await createUntypedClient();
  const { data: rows } = await supabase
    .from("lead_statuses")
    .select("id, name, is_default");
  const list = rows ?? [];
  if (list.length <= 1) throw new Error("Precisa haver ao menos uma coluna.");
  const alvo = list.find((r) => r.id === id);
  if (!alvo) throw new Error("Coluna não encontrada.");

  const destino = list.find((r) => r.id !== id && r.name === reassignToName);
  if (!destino) throw new Error("Escolha uma coluna de destino válida.");

  const { error: upErr } = await supabase
    .from("vendas_leads")
    .update({ status: destino.name, atualizado_em: new Date().toISOString() })
    .eq("status", alvo.name);
  if (upErr) throw new Error(upErr.message);

  const { error } = await supabase.from("lead_statuses").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (alvo.is_default) {
    await supabase
      .from("lead_statuses")
      .update({ is_default: true })
      .eq("id", destino.id);
  }
  revalidatePath("/pipeline");
}
