/** Constantes/tipos de tarefas — fora do actions.ts (use server só exporta funcao). */

export const TASK_STATUS = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type TaskStatusReal = (typeof TASK_STATUS)[number];

export const TASK_PRIORITY = ["low", "medium", "high", "urgent"] as const;
export type TaskPriorityReal = (typeof TASK_PRIORITY)[number];

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
  status: TaskStatusReal;
  priority: TaskPriorityReal;
  clientId?: string | null;
  dueDate?: string | null;
  driveLink?: string | null;
  figmaLink?: string | null;
  assignees: string[];
  subtasks: SubtaskInput[];
}
