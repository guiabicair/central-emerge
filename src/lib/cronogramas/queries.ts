import "server-only";

import { createUntypedClient } from "@/lib/supabase/server";
import type {
  CronogramaChecklist,
  CronogramaFase,
  CronogramaItem,
  CronogramaSecao,
  CronogramaTree,
} from "@/lib/cronogramas/types";

export interface CronogramaHeader {
  id: string;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  currentFaseId: string | null;
  templateKey: string | null;
  shareToken: string;
  faseCount: number;
  itemCount: number;
  doneCount: number;
}

/** Cronogramas de um cliente (cabeçalho + contadores). Degrada pré-0015. */
export async function listCronogramas(
  clientId: string,
): Promise<CronogramaHeader[]> {
  const db = await createUntypedClient();
  const { data, error } = await db
    .from("app_cronogramas")
    .select("id, title, description, start_date, end_date, current_fase_id, template_key, share_token")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const ids = data.map((c: { id: string }) => c.id);
  const { data: itens } = ids.length
    ? await db
        .from("app_cronograma_itens")
        .select("cronograma_id, status")
        .in("cronograma_id", ids)
    : { data: [] as { cronograma_id: string; status: string }[] };
  const { data: fases } = ids.length
    ? await db
        .from("app_cronograma_fases")
        .select("cronograma_id")
        .in("cronograma_id", ids)
    : { data: [] as { cronograma_id: string }[] };

  const byCrono = (rows: { cronograma_id: string }[]) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.cronograma_id, (m.get(r.cronograma_id) ?? 0) + 1);
    return m;
  };
  const faseCnt = byCrono(fases ?? []);
  const itemCnt = byCrono(itens ?? []);
  const doneCnt = byCrono(
    (itens ?? []).filter((i: { status: string }) => i.status === "concluido"),
  );

  return data.map((c: Record<string, unknown>) => ({
    id: c.id as string,
    title: c.title as string,
    description: (c.description as string) ?? null,
    startDate: (c.start_date as string) ?? null,
    endDate: (c.end_date as string) ?? null,
    currentFaseId: (c.current_fase_id as string) ?? null,
    templateKey: (c.template_key as string) ?? null,
    shareToken: c.share_token as string,
    faseCount: faseCnt.get(c.id as string) ?? 0,
    itemCount: itemCnt.get(c.id as string) ?? 0,
    doneCount: doneCnt.get(c.id as string) ?? 0,
  }));
}

export interface CronogramaFull {
  id: string;
  clientId: string | null;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  currentFaseId: string | null;
  shareToken: string;
  fases: (CronogramaFase & { id: string; itemsWithId: (CronogramaItem & { id: string })[] })[];
  checklists: (CronogramaChecklist & {
    id: string;
    itemsWithId: { id: string; text: string; done: boolean }[];
  })[];
  secoes: (CronogramaSecao & { id: string })[];
}

/** Árvore completa de 1 cronograma (com ids, pra edição). */
export async function getCronogramaFull(
  id: string,
): Promise<CronogramaFull | null> {
  const db = await createUntypedClient();
  const [{ data: c }, { data: fs }, { data: it }, { data: cl }, { data: cli }, { data: sc }] =
    await Promise.all([
      db.from("app_cronogramas").select("*").eq("id", id).maybeSingle(),
      db.from("app_cronograma_fases").select("*").eq("cronograma_id", id).order("position"),
      db.from("app_cronograma_itens").select("*").eq("cronograma_id", id).order("position"),
      db.from("app_cronograma_checklists").select("*").eq("cronograma_id", id).order("position"),
      db
        .from("app_cronograma_checklist_itens")
        .select("*")
        .order("position"),
      db.from("app_cronograma_secoes").select("*").eq("cronograma_id", id).order("position"),
    ]);
  if (!c) return null;

  type Row = Record<string, unknown>;
  const itensByFase = new Map<string, (CronogramaItem & { id: string })[]>();
  for (const i of (it ?? []) as Row[]) {
    const arr = itensByFase.get(i.fase_id as string) ?? [];
    arr.push({
      id: i.id as string,
      text: i.text as string,
      status: i.status as CronogramaItem["status"],
      date: (i.date as string) ?? null,
      taskId: (i.task_id as string) ?? null,
    });
    itensByFase.set(i.fase_id as string, arr);
  }

  const clItensByCl = new Map<string, { id: string; text: string; done: boolean }[]>();
  const validCl = new Set((cl ?? []).map((x: Row) => x.id as string));
  for (const x of (cli ?? []) as Row[]) {
    if (!validCl.has(x.checklist_id as string)) continue;
    const arr = clItensByCl.get(x.checklist_id as string) ?? [];
    arr.push({ id: x.id as string, text: x.text as string, done: !!x.done });
    clItensByCl.set(x.checklist_id as string, arr);
  }

  return {
    id: c.id as string,
    clientId: (c.client_id as string) ?? null,
    title: c.title as string,
    description: (c.description as string) ?? null,
    startDate: (c.start_date as string) ?? null,
    endDate: (c.end_date as string) ?? null,
    currentFaseId: (c.current_fase_id as string) ?? null,
    shareToken: c.share_token as string,
    fases: ((fs ?? []) as Row[]).map((f) => ({
      id: f.id as string,
      title: f.title as string,
      note: (f.note as string) ?? null,
      intervalLabel: (f.interval_label as string) ?? null,
      startDate: (f.start_date as string) ?? null,
      endDate: (f.end_date as string) ?? null,
      items: itensByFase.get(f.id as string) ?? [],
      itemsWithId: itensByFase.get(f.id as string) ?? [],
    })),
    checklists: ((cl ?? []) as Row[]).map((x) => ({
      id: x.id as string,
      title: x.title as string,
      items: (clItensByCl.get(x.id as string) ?? []).map((i) => ({
        text: i.text,
        done: i.done,
      })),
      itemsWithId: clItensByCl.get(x.id as string) ?? [],
    })),
    secoes: ((sc ?? []) as Row[]).map((x) => ({
      id: x.id as string,
      kind: (x.kind as CronogramaSecao["kind"]) ?? "livre",
      title: x.title as string,
      blocks: Array.isArray(x.body) ? (x.body as CronogramaSecao["blocks"]) : [],
    })),
  };
}

/** Vista pública por token (RPC SECURITY DEFINER). null se token não casa. */
export async function getPublicCronograma(
  token: string,
): Promise<CronogramaTree | null> {
  const db = await createUntypedClient();
  const { data, error } = await db.rpc("get_cronograma_by_token", {
    p_token: token,
  });
  if (error || !data || !data.cronograma) return null;

  type Row = Record<string, unknown>;
  const c = data.cronograma as Row;
  const fases = (data.fases ?? []) as Row[];
  const itens = (data.itens ?? []) as Row[];
  const itensByFase = new Map<string, CronogramaItem[]>();
  for (const i of itens) {
    const arr = itensByFase.get(i.fase_id as string) ?? [];
    arr.push({
      text: i.text as string,
      status: i.status as CronogramaItem["status"],
      date: (i.date as string) ?? null,
      taskId: null,
    });
    itensByFase.set(i.fase_id as string, arr);
  }
  const faseList = fases.map((f) => ({
    title: f.title as string,
    note: (f.note as string) ?? null,
    intervalLabel: (f.interval_label as string) ?? null,
    startDate: (f.start_date as string) ?? null,
    endDate: (f.end_date as string) ?? null,
    items: itensByFase.get(f.id as string) ?? [],
  }));
  const currentIdx = fases.findIndex(
    (f) => f.id === (c.current_fase_id as string),
  );

  return {
    title: c.title as string,
    description: (c.description as string) ?? null,
    startDate: (c.start_date as string) ?? null,
    endDate: (c.end_date as string) ?? null,
    currentFaseIndex: currentIdx >= 0 ? currentIdx : null,
    fases: faseList,
    checklists: ((data.checklists ?? []) as { checklist: Row; itens: Row[] }[]).map(
      (x) => ({
        title: x.checklist.title as string,
        items: (x.itens ?? []).map((i) => ({
          text: i.text as string,
          done: !!i.done,
        })),
      }),
    ),
    secoes: ((data.secoes ?? []) as Row[]).map((x) => ({
      kind: (x.kind as CronogramaSecao["kind"]) ?? "livre",
      title: x.title as string,
      blocks: Array.isArray(x.body)
        ? (x.body as CronogramaSecao["blocks"])
        : [],
    })),
  };
}
