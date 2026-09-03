/** Constantes/tipos de tarefas — fora do actions.ts (use server só exporta funcao). */

/**
 * Status legados. A partir do 3b as colunas do Kanban vêm de task_statuses
 * (name é texto livre, validado na action). Este array é só fallback/seed.
 */
export const TASK_STATUS = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type TaskStatusReal = (typeof TASK_STATUS)[number];

export const TASK_PRIORITY = ["low", "medium", "high", "urgent"] as const;
export type TaskPriorityReal = (typeof TASK_PRIORITY)[number];

/** Rótulos amigáveis pros nomes de coluna canônicos; custom cai no name cru. */
export const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
  revisao: "Revisão",
};

/** Paleta de cor das colunas (palavra -> token). */
export const STATUS_COLORS = [
  "slate",
  "blue",
  "green",
  "amber",
  "violet",
  "rose",
  "teal",
] as const;
export const STATUS_COLOR_DOT: Record<string, string> = {
  slate: "var(--ink-muted)",
  blue: "var(--wip)",
  green: "var(--done)",
  amber: "var(--warn)",
  violet: "var(--auto)",
  rose: "var(--gap)",
  teal: "var(--data)",
};

export interface StatusCol {
  id: string;
  name: string;
  color: string;
  position: number;
}

export const colLabel = (name: string) => STATUS_LABEL[name] ?? name;
export const colDot = (color: string) =>
  STATUS_COLOR_DOT[color] ?? "var(--ink-muted)";

export const PRIORITY_META: Record<
  string,
  { label: string; color: string }
> = {
  low: { label: "Baixa", color: "slate" },
  medium: { label: "Média", color: "blue" },
  high: { label: "Alta", color: "amber" },
  urgent: { label: "Urgente", color: "rose" },
};

export interface SubtaskInput {
  /** id real quando já existe; ausente = nova (ainda não persistida) */
  id?: string;
  title: string;
  done: boolean;
}

export interface TaskInput {
  id?: string;
  title: string;
  description?: string;
  briefing?: string;
  /** name de uma linha de task_statuses (texto livre desde o 3b) */
  status: string;
  priority: TaskPriorityReal;
  clientId?: string | null;
  dueDate?: string | null;
  driveLink?: string | null;
  figmaLink?: string | null;
  assignees: string[];
  subtasks: SubtaskInput[];
}
