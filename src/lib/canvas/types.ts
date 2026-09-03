/** Tipos do canvas de nós. Tabelas app_canvas_* (migration 0009). */

/** sentinel de owner = layout compartilhado (a coluna é NOT NULL). */
export const SHARED_OWNER = "00000000-0000-0000-0000-000000000000";

export interface CanvasNodePos {
  entityId: string;
  x: number;
  y: number;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label: string | null;
}

/** dados vindos do servidor pra hidratar o <EntityCanvas>. */
export interface CanvasSnapshot {
  positions: Record<string, { x: number; y: number }>;
  edges: CanvasEdge[];
}
