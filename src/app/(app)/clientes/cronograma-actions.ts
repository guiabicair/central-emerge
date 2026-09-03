"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/lib/auth/roles";
import { getUser } from "@/lib/supabase/auth";
import { createUntypedClient } from "@/lib/supabase/server";
import { resolveTemplate } from "@/lib/cronogramas/templates";

async function guard() {
  if (!(await can("clientes.manage"))) {
    throw new Error("Sem permissão para gerir cronogramas.");
  }
}

const ITEM_STATUS = ["concluido", "em_andamento", "agendado", "a_fazer"];

/** Cria um cronograma (vazio, por template ou importando um de referência). */
export async function createCronograma(
  clientId: string,
  title: string,
  templateKey: string,
) {
  await guard();
  const user = await getUser();
  const db = await createUntypedClient();

  const tpl = resolveTemplate(templateKey);
  const nome = (title.trim() || tpl?.title || "Novo cronograma").slice(0, 120);

  const { data: crono, error } = await db
    .from("app_cronogramas")
    .insert({
      title: nome,
      description: tpl?.tree.description ?? null,
      client_id: clientId,
      template_key: templateKey || null,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !crono) throw new Error(error?.message ?? "Falhou ao criar.");
  const cronogramaId = (crono as { id: string }).id;

  if (tpl) {
    for (let fi = 0; fi < tpl.tree.fases.length; fi++) {
      const f = tpl.tree.fases[fi]!;
      const { data: fase } = await db
        .from("app_cronograma_fases")
        .insert({
          cronograma_id: cronogramaId,
          title: f.title,
          note: f.note,
          interval_label: f.intervalLabel,
          start_date: f.startDate,
          end_date: f.endDate,
          position: fi,
        })
        .select("id")
        .single();
      const faseId = (fase as { id: string } | null)?.id;
      if (faseId && f.items.length) {
        await db.from("app_cronograma_itens").insert(
          f.items.map((it, ii) => ({
            cronograma_id: cronogramaId,
            fase_id: faseId,
            text: it.text,
            status: ITEM_STATUS.includes(it.status) ? it.status : "a_fazer",
            date: it.date,
            position: ii,
          })),
        );
      }
      if (fi === 0 && faseId) {
        await db
          .from("app_cronogramas")
          .update({ current_fase_id: faseId })
          .eq("id", cronogramaId);
      }
    }

    for (let ci = 0; ci < tpl.tree.checklists.length; ci++) {
      const cl = tpl.tree.checklists[ci]!;
      const { data: clRow } = await db
        .from("app_cronograma_checklists")
        .insert({ cronograma_id: cronogramaId, title: cl.title, position: ci })
        .select("id")
        .single();
      const clId = (clRow as { id: string } | null)?.id;
      if (clId && cl.items.length) {
        await db.from("app_cronograma_checklist_itens").insert(
          cl.items.map((it, ii) => ({
            checklist_id: clId,
            text: it.text,
            done: !!it.done,
            position: ii,
          })),
        );
      }
    }

    if (tpl.tree.secoes.length) {
      await db.from("app_cronograma_secoes").insert(
        tpl.tree.secoes.map((s, si) => ({
          cronograma_id: cronogramaId,
          kind: s.kind,
          title: s.title,
          body: s.blocks,
          position: si,
        })),
      );
    }
  }

  revalidatePath(`/clientes/${clientId}`);
  return { id: cronogramaId };
}

export async function deleteCronograma(id: string, clientId: string) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db.from("app_cronogramas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}`);
}

export async function setItemStatus(
  itemId: string,
  cronogramaId: string,
  clientId: string,
  status: string,
) {
  await guard();
  if (!ITEM_STATUS.includes(status)) throw new Error("Status inválido.");
  const db = await createUntypedClient();
  const { error } = await db
    .from("app_cronograma_itens")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/cronograma/${cronogramaId}`);
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/calendario");
}

export async function setItemDate(
  itemId: string,
  cronogramaId: string,
  clientId: string,
  date: string | null,
) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db
    .from("app_cronograma_itens")
    .update({ date: date || null, updated_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/cronograma/${cronogramaId}`);
  revalidatePath("/calendario");
}

export async function toggleCheckItem(
  itemId: string,
  cronogramaId: string,
  clientId: string,
  done: boolean,
) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db
    .from("app_cronograma_checklist_itens")
    .update({ done })
    .eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/cronograma/${cronogramaId}`);
}

export async function setCurrentFase(
  cronogramaId: string,
  clientId: string,
  faseId: string,
) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db
    .from("app_cronogramas")
    .update({ current_fase_id: faseId, updated_at: new Date().toISOString() })
    .eq("id", cronogramaId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/cronograma/${cronogramaId}`);
  revalidatePath(`/clientes/${clientId}`);
}

export async function updateCronogramaMeta(
  id: string,
  clientId: string,
  input: {
    title: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
  },
) {
  await guard();
  if (!input.title.trim()) throw new Error("Título é obrigatório.");
  const db = await createUntypedClient();
  const { error } = await db
    .from("app_cronogramas")
    .update({
      title: input.title.trim().slice(0, 120),
      description: input.description.trim() || null,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clientId}/cronograma/${id}`);
  revalidatePath(`/clientes/${clientId}`);
}
