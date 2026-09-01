/**
 * Modelo de dominio da Central Emerge (Fase 1 — sem Supabase ainda).
 * Espelha a "Prospeccao Organizada" do app atual: cada card do pipeline
 * e um Lead/Deal com contato, segmento, tag colorida, estagio e valor.
 * Quando o schema real do Supabase entrar, estes tipos viram a fonte
 * de verdade do client tipado.
 */

export type PipelineStageId =
  | "lead"
  | "primeira-chamada"
  | "reuniao"
  | "proposta"
  | "negociacao"
  | "fechado"
  | "perdido";

export interface TeamMember {
  id: string;
  nome: string;
  /** iniciais pre-calculadas para o avatar fallback */
  iniciais: string;
  cor: string;
  avatarUrl?: string;
}

/** Cor da "tag colorida" do card, como no Kanban atual. */
export type LeadTagColor =
  | "aqua"
  | "lime"
  | "violet"
  | "blue"
  | "amber"
  | "rose"
  | "slate";

export interface LeadTag {
  label: string;
  color: LeadTagColor;
}

export interface Lead {
  id: string;
  nome: string;
  empresa?: string;
  telefone?: string;
  email?: string;
  site?: string;
  segmento: string;
  tag: LeadTag;
  stage: PipelineStageId;
  /** valor potencial do negocio em BRL (centavos evitados: usamos reais) */
  valor: number;
  responsavelId: string;
  /** ISO date da ultima interacao — alimenta a ordenacao/urgencia */
  atualizadoEm: string;
  origem?: string;
  observacao?: string;
}
