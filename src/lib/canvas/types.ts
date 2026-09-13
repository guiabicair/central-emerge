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
  colors: Record<string, string>;
  edges: CanvasEdge[];
}

/** paleta padrão de recolorir nós — mesma da Equipe → Organização (org-view.tsx). */
export const NODE_COLORS = [
  "#45f0d1",
  "#c9ff3f",
  "#93a6ff",
  "#fbbf24",
  "#ff8f6b",
  "#c98bff",
] as const;
