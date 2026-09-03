/** Constantes/tipos do pipeline — fora do actions.ts (use server só exporta funcao). */

export const LEAD_STATUS = [
  "novo",
  "contatado",
  "qualificado",
  "virou_proposta",
  "proposta_aprovada",
  "descartado",
] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export const LEAD_FRENTE = [
  "criptoforja",
  "grupo_today_os",
  "emerge_financeiro",
  "emerge_propostas_dev",
  "outro",
] as const;
export type LeadFrente = (typeof LEAD_FRENTE)[number];

export interface LeadInput {
  id?: number;
  empresa: string;
  frente: LeadFrente;
  segmento?: string;
  contato?: string;
  origem?: string;
  valor_estimado?: number;
  responsavel?: string;
  status: LeadStatus;
  motivo_fit?: string;
  proposta_slug?: string;
}
