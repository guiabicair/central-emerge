"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/lib/auth/roles";
import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Registra um novo valor de caixa. company_cash é append-only: cada
 * ajuste é uma linha nova (current_amount + description = motivo +
 * updated_by = quem + updated_at = quando). O histórico É o log.
 */
export async function adjustCash(input: { amount: number; motivo: string }) {
  if (!(await can("financeiro.manage"))) {
    throw new Error("Sem permissão para ajustar o caixa.");
  }
  const motivo = input.motivo.trim();
  if (!motivo) throw new Error("Informe o motivo do ajuste.");
  if (!Number.isFinite(input.amount)) throw new Error("Valor inválido.");

  const user = await getUser();
  if (!user) throw new Error("Sessão expirada.");

  const supabase = await createClient();
  const { error } = await supabase.from("company_cash").insert({
    current_amount: Math.round(input.amount * 100) / 100,
    description: motivo,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/financeiro");
}
