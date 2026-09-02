import { PIPELINE_STAGES } from "@/lib/pipeline";
import { TASK_COLUMNS, horasNaSemana, isAtiva, isAtrasada } from "@/lib/tasks";
import type { Lead, Task, TeamMember, Transaction } from "@/lib/types";

/* --------------------------------------------------------------------------
 * Agregacoes para o Dashboard. Funcoes puras sobre os dados mockados —
 * quando o Supabase entrar, viram queries/materialized views.
 * ---------------------------------------------------------------------- */

export interface FunnelRow {
  stageId: string;
  label: string;
  accent: string;
  count: number;
  valor: number;
}

export function pipelineFunnel(leads: Lead[]): FunnelRow[] {
  return PIPELINE_STAGES.map((stage) => {
    const rows = leads.filter((l) => l.stage === stage.id);
    return {
      stageId: stage.id,
      label: stage.label,
      accent: stage.accent,
      count: rows.length,
      valor: rows.reduce((s, l) => s + l.valor, 0),
    };
  });
}

export function pipelineEmAberto(leads: Lead[]): number {
  return leads
    .filter((l) => l.stage !== "fechado" && l.stage !== "perdido")
    .reduce((s, l) => s + l.valor, 0);
}

export function taxaFechamento(leads: Lead[]): number {
  const fechados = leads.filter((l) => l.stage === "fechado").length;
  const perdidos = leads.filter((l) => l.stage === "perdido").length;
  const decididos = fechados + perdidos;
  return decididos ? fechados / decididos : 0;
}

export interface StatusRow {
  id: string;
  label: string;
  accent: string;
  count: number;
}

export function taskStatusBreakdown(tasks: Task[]): StatusRow[] {
  return TASK_COLUMNS.map((col) => ({
    id: col.id,
    label: col.label,
    accent: col.accent,
    count: tasks.filter((t) => t.status === col.id).length,
  }));
}

export interface RevenuePoint {
  label: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

/** Transacoes agrupadas por dia, com saldo acumulado. */
export function revenueSeries(transactions: Transaction[]): RevenuePoint[] {
  const byDay = new Map<string, { entradas: number; saidas: number }>();
  for (const tx of transactions) {
    const day = tx.data.slice(0, 10);
    const acc = byDay.get(day) ?? { entradas: 0, saidas: 0 };
    if (tx.tipo === "entrada") acc.entradas += tx.valor;
    else acc.saidas += tx.valor;
    byDay.set(day, acc);
  }

  const dias = [...byDay.keys()].sort();
  let saldo = 0;
  return dias.map((day) => {
    const { entradas, saidas } = byDay.get(day)!;
    saldo += entradas - saidas;
    const [, m, d] = day.split("-");
    return { label: `${d}/${m}`, entradas, saidas, saldo };
  });
}

export interface TeamHoursRow {
  id: string;
  nome: string;
  primeiroNome: string;
  cor: string;
  horas: number;
  ativas: number;
  atrasadas: number;
}

export function teamHours(tasks: Task[], team: TeamMember[]): TeamHoursRow[] {
  return team.map((m) => {
    const suas = tasks.filter((t) => t.responsavelId === m.id);
    return {
      id: m.id,
      nome: m.nome,
      primeiroNome: m.nome.split(" ")[0]!,
      cor: m.cor,
      horas: suas.reduce((s, t) => s + horasNaSemana(t, m.id), 0),
      ativas: suas.filter(isAtiva).length,
      atrasadas: suas.filter(isAtrasada).length,
    };
  });
}

export function taskCompletion(tasks: Task[]): {
  pct: number;
  done: number;
  total: number;
} {
  let done = 0;
  let total = 0;
  for (const t of tasks) {
    for (const s of t.subtarefas) {
      total += 1;
      if (s.concluida) done += 1;
    }
  }
  return { pct: total ? done / total : 0, done, total };
}
