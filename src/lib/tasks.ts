import dagre from "@dagrejs/dagre";

import type { PillColor } from "@/components/status-pill";
import type { Task, TaskColumn, TaskPriority } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Colunas do fluxo de producao (defaults — o usuario pode adicionar mais)     */
/* -------------------------------------------------------------------------- */

export const TASK_COLUMNS: TaskColumn[] = [
  { id: "briefing", label: "Briefing", accent: "#7c9cff", descricao: "Escopo sendo definido" },
  { id: "solicitacao", label: "Solicitação", accent: "#38bdf8", descricao: "Aprovado, aguardando início" },
  { id: "em-producao", label: "Em Produção", accent: "#45f0d1", descricao: "Sendo executada" },
  { id: "alteracao", label: "Alteração", accent: "#fbbf24", descricao: "Ajustes solicitados" },
  { id: "pausa", label: "Pausa", accent: "#c98bff", descricao: "Bloqueada / aguardando terceiros" },
  { id: "aprovacao", label: "Aprovação", accent: "#34d399", descricao: "Entregue, em revisão final" },
];

export const TASK_CATEGORIES = [
  "Design",
  "Desenvolvimento",
  "Atendimento",
  "Financeiro",
  "Prospecção",
] as const;

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; color: PillColor }
> = {
  urgente: { label: "Urgente", color: "rose" },
  alta: { label: "Alta", color: "amber" },
  media: { label: "Média", color: "blue" },
  baixa: { label: "Baixa", color: "slate" },
};

/* -------------------------------------------------------------------------- */
/* Helpers de dominio                                                          */
/* -------------------------------------------------------------------------- */

export function totalHoras(task: Task): number {
  return task.registrosTempo.reduce((s, e) => s + e.horas, 0);
}

/** Horas registradas nos ultimos 7 dias, opcionalmente filtrando por pessoa. */
export function horasNaSemana(task: Task, pessoaId?: string): number {
  const limite = Date.now() - 7 * 86_400_000;
  return task.registrosTempo
    .filter((e) => new Date(e.data).getTime() >= limite)
    .filter((e) => !pessoaId || e.pessoaId === pessoaId)
    .reduce((s, e) => s + e.horas, 0);
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export function isAtrasada(task: Task): boolean {
  return (
    task.status !== "aprovacao" &&
    new Date(task.prazo).getTime() < Date.now() &&
    isoDay(new Date(task.prazo)) !== isoDay(new Date())
  );
}

export function isHoje(task: Task): boolean {
  return isoDay(new Date(task.prazo)) === isoDay(new Date());
}

export function isAtiva(task: Task): boolean {
  return task.status !== "aprovacao";
}

export function subtaskProgress(task: Task): { done: number; total: number } {
  return {
    done: task.subtarefas.filter((s) => s.concluida).length,
    total: task.subtarefas.length,
  };
}

/** Proxima coluna do fluxo, ou null se ja estiver na ultima. */
export function nextColumn(
  columns: TaskColumn[],
  currentId: string,
): TaskColumn | null {
  const i = columns.findIndex((c) => c.id === currentId);
  if (i === -1 || i >= columns.length - 1) return null;
  return columns[i + 1]!;
}

/* -------------------------------------------------------------------------- */
/* Grafo de dependencias                                                       */
/* -------------------------------------------------------------------------- */

export interface DepEdge {
  id: string;
  source: string;
  target: string;
  /** cor da aresta reflete o "gap": bloqueio real acontecendo */
  tone: "done" | "open" | "late";
}

/**
 * Aresta = bloqueadora -> bloqueada. Se B.dependsOn inclui A, gera A -> B.
 * tone: bloqueadora concluida = "done"; atrasada = "late"; senao "open".
 */
export function buildDependencyEdges(tasks: Task[]): DepEdge[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const edges: DepEdge[] = [];
  for (const task of tasks) {
    for (const blockerId of task.dependsOn) {
      const blocker = byId.get(blockerId);
      if (!blocker) continue;
      const tone: DepEdge["tone"] = isAtrasada(blocker)
        ? "late"
        : blocker.status === "aprovacao"
          ? "done"
          : "open";
      edges.push({
        id: `dep-${blockerId}-${task.id}`,
        source: blockerId,
        target: task.id,
        tone,
      });
    }
  }
  return edges;
}

/** ids de tasks que participam de pelo menos uma dependencia. */
export function connectedTaskIds(tasks: Task[], edges: DepEdge[]): Set<string> {
  const set = new Set<string>();
  for (const e of edges) {
    set.add(e.source);
    set.add(e.target);
  }
  return set;
}

export interface XY {
  x: number;
  y: number;
}

/** Auto-layout do DAG com dagre (LR por padrao). Retorna posicao por id. */
export function layoutWithDagre(
  nodeIds: string[],
  edges: { source: string; target: string }[],
  opts: { width: number; height: number; rankdir?: "LR" | "TB" } = {
    width: 240,
    height: 96,
  },
): Record<string, XY> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: opts.rankdir ?? "LR",
    nodesep: 28,
    ranksep: 80,
    marginx: 16,
    marginy: 16,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const id of nodeIds) {
    g.setNode(id, { width: opts.width, height: opts.height });
  }
  for (const e of edges) {
    if (nodeIds.includes(e.source) && nodeIds.includes(e.target)) {
      g.setEdge(e.source, e.target);
    }
  }

  dagre.layout(g);

  const pos: Record<string, XY> = {};
  for (const id of nodeIds) {
    const n = g.node(id);
    // dagre devolve centro do no; React Flow espera canto superior-esquerdo
    pos[id] = { x: n.x - opts.width / 2, y: n.y - opts.height / 2 };
  }
  return pos;
}

/** Guard de dev: avisa se dependsOn formar ciclo (quebraria o DAG). */
export function assertAcyclic(tasks: Task[]): void {
  if (process.env.NODE_ENV === "production") return;
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const state = new Map<string, 0 | 1 | 2>();
  const visit = (id: string): boolean => {
    const s = state.get(id) ?? 0;
    if (s === 1) return true; // ciclo
    if (s === 2) return false;
    state.set(id, 1);
    for (const dep of byId.get(id)?.dependsOn ?? []) {
      if (visit(dep)) return true;
    }
    state.set(id, 2);
    return false;
  };
  for (const t of tasks) {
    if (visit(t.id)) {
      console.warn(`[tasks] ciclo de dependencia detectado envolvendo "${t.id}"`);
      return;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Filtros                                                                     */
/* -------------------------------------------------------------------------- */

export interface TaskFilters {
  busca: string;
  minhas: boolean;
  atrasadas: boolean;
  hoje: boolean;
  responsaveis: string[];
}

export const EMPTY_FILTERS: TaskFilters = {
  busca: "",
  minhas: false,
  atrasadas: false,
  hoje: false,
  responsaveis: [],
};

export function filterTasks(
  tasks: Task[],
  filters: TaskFilters,
  currentUserId: string,
): Task[] {
  const q = filters.busca.trim().toLowerCase();
  return tasks.filter((t) => {
    if (q && !t.titulo.toLowerCase().includes(q) && !t.briefing.toLowerCase().includes(q)) {
      return false;
    }
    if (filters.minhas && t.responsavelId !== currentUserId) return false;
    if (filters.atrasadas && !isAtrasada(t)) return false;
    if (filters.hoje && !isHoje(t)) return false;
    if (
      filters.responsaveis.length > 0 &&
      !filters.responsaveis.includes(t.responsavelId)
    ) {
      return false;
    }
    return true;
  });
}

export function countFilters(f: TaskFilters): number {
  return (
    (f.busca.trim() ? 1 : 0) +
    (f.minhas ? 1 : 0) +
    (f.atrasadas ? 1 : 0) +
    (f.hoje ? 1 : 0) +
    (f.responsaveis.length > 0 ? 1 : 0)
  );
}
