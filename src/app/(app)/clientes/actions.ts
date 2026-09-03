"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

async function guard() {
  if (!(await can("clientes.manage"))) {
    throw new Error("Sem permissão para gerir clientes.");
  }
}

export interface ClientInput {
  id?: string;
  name: string;
  segment?: string;
  mrr?: number;
  status: "active" | "inactive";
  contact_name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

function normalize(input: ClientInput) {
  return {
    name: input.name.trim(),
    segment: input.segment?.trim() || null,
    mrr: Number.isFinite(input.mrr) ? Math.max(0, Number(input.mrr)) : 0,
    status: input.status === "inactive" ? "inactive" : "active",
    contact_name: input.contact_name?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

export async function saveClient(input: ClientInput) {
  await guard();
  if (!input.name.trim()) throw new Error("Nome é obrigatório.");

  const supabase = await createClient();
  const row = normalize(input);

  // is_seed marca "cliente real / curado" (seed OU criado aqui). O que fica
  // com is_seed=false são as ~21 linhas de teste legadas do Lovable, que a
  // lista esconde por padrão. Cliente criado no app é real → is_seed=true.
  const { error } = input.id
    ? await supabase.from("clients").update(row).eq("id", input.id)
    : await supabase.from("clients").insert({ ...row, is_seed: true });

  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
}

export async function deleteClient(id: string) {
  await guard();
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
}
