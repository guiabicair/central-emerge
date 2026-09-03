/**
 * Modelo em árvore de um cronograma. O parser dos HTMLs de referência
 * (docs/cronogramas-ref/) produz este shape; a UI consome o mesmo; e o
 * INSERT no banco (migration 0015, pós-ACK da Régie) mapeia 1:1.
 */

export type CronogramaItemStatus =
  | "concluido"
  | "em_andamento"
  | "agendado"
  | "a_fazer";

export interface CronogramaItem {
  text: string;
  status: CronogramaItemStatus;
  /** "YYYY-MM-DD" quando o item tem data — aparece no /calendario */
  date: string | null;
  /** id de uma task vinculada (edição espelhada) */
  taskId: string | null;
}

export interface CronogramaFase {
  title: string;
  note: string | null;
  /** rótulo de intervalo livre: "Semanas 2–3", "Até 15/10", "Mês 4" */
  intervalLabel: string | null;
  startDate: string | null;
  endDate: string | null;
  items: CronogramaItem[];
}

export interface CronogramaChecklist {
  title: string;
  items: { text: string; done: boolean }[];
}

/** Seções de conteúdo livres (roteiro de gravação, calendário de postagem…). */
export interface CronogramaSecao {
  kind: "roteiro" | "calendario" | "livre";
  title: string;
  /** blocos flexíveis — cada bloco é um sub-título + notas + meta opcional */
  blocks: {
    heading: string;
    meta: string | null;
    notes: string[];
  }[];
}

export interface CronogramaTree {
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  /** índice da fase "estamos aqui agora" (na lista fases) */
  currentFaseIndex: number | null;
  fases: CronogramaFase[];
  checklists: CronogramaChecklist[];
  secoes: CronogramaSecao[];
}
