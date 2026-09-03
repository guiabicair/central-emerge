"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const LEAD_STATUS = [
  "novo",
  "contatado",
  "qualificado",
  "descartado",
  "virou_proposta",
] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export const LEAD_FRENTE = [
  "criptoforja",
  "grupo_today_os",
  "emerge_financeiro",
  "emerge_propostas_dev",
  "outro",
] as const;
export type LeadFrente = (typeof LEAD_FRENTE)[number];

export interface LeadInput {
  id?: number;
  empresa: string;
  frente: LeadFrente;
  segmento?: string;
  contato?: string;
  origem?: string;
  valor_estimado?: number;
  responsavel?: string;
  status: LeadStatus;
  motivo_fit?: string;
}

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
