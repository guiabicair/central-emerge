"use server";

import { revalidatePath } from "next/cache";

import {
  LEAD_FRENTE,
  LEAD_STATUS,
  type LeadInput,
  type LeadStatus,
} from "@/app/(app)/pipeline/lead-constants";
import { can } from "@/lib/auth/roles";
import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

async function guard() {
  if (!(await can("pipeline.manage"))) {
    throw new Error("Sem permissão para gerir o pipeline.");
  }
}

export async function saveLead(input: LeadInput) {
  await guard();
  if (!input.empresa.trim()) throw new Error("Empresa é obrigatória.");
  if (!LEAD_FRENTE.includes(input.frente)) throw new Error("Frente inválida.");
  if (!LEAD_STATUS.includes(input.status)) throw new Error("Estágio inválido.");

  const supabase = await createClient();
  const row = {
    empresa: input.empresa.trim(),
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

export async function moveLeadStage(id: number, status: LeadStatus) {
  await guard();
  if (!LEAD_STATUS.includes(status)) throw new Error("Estágio inválido.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendas_leads")
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}

export async function deleteLead(id: number) {
  await guard();
  const supabase = await createClient();
  const { error } = await supabase.from("vendas_leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}

/** Vincula (ou desvincula) a proposta de um lead pelo slug. */
export async function linkProposta(id: number, slug: string) {
  await guard();
  const supabase = await createClient();
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
  const supabase = await createClient();

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
