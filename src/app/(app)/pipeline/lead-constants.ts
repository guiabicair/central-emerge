/** Constantes/tipos do pipeline — fora do actions.ts (use server só exporta funcao). */

/** Estágios legados — seed inicial de lead_statuses (migration 0026). A
 * partir dela as colunas do board vêm do banco (name é texto livre). */
export const LEAD_STATUS = [
  "novo",
  "contatado",
  "qualificado",
  "virou_proposta",
  "proposta_aprovada",
  "descartado",
] as const;

export const LEAD_FRENTE = [
  "criptoforja",
  "grupo_today_os",
  "emerge_financeiro",
  "emerge_propostas_dev",
  "eventos",
  "outro",
] as const;
export type LeadFrente = (typeof LEAD_FRENTE)[number];

/** Unidade de negócio (migration 0028) — funis separados no mesmo pipeline. */
export const LEAD_UNIDADE = ["labs", "tech"] as const;
export type LeadUnidade = (typeof LEAD_UNIDADE)[number];
export const UNIDADE_LABEL: Record<LeadUnidade, string> = {
  labs: "Emerge Labs",
  tech: "Emerge Tech",
};

/** Paleta de cor das colunas — mesmo conjunto de task-constants.ts. */
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

const STAGE_LABEL: Record<string, string> = {
  novo: "Novo",
  contatado: "Contatado",
  qualificado: "Qualificado",
  virou_proposta: "Virou proposta",
  proposta_aprovada: "Proposta aprovada",
  descartado: "Descartado",
};

export const colLabel = (name: string) => STAGE_LABEL[name] ?? name;
export const colDot = (color: string) =>
  STATUS_COLOR_DOT[color] ?? "var(--ink-muted)";

export interface LeadInput {
  id?: number;
  empresa: string;
  unidade: LeadUnidade;
  frente: LeadFrente;
  segmento?: string;
  contato?: string;
  origem?: string;
  valor_estimado?: number;
  responsavel?: string;
  /** name de uma linha de lead_statuses (texto livre desde a 0026) */
  status: string;
  motivo_fit?: string;
  proposta_slug?: string;
}
