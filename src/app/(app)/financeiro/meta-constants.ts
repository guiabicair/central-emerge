/** Constantes/tipos de metas — fora do actions.ts (use server só exporta funcao). */

export const META_FRENTES = [
  "geral",
  "emerge_financeiro",
  "emerge_propostas_dev",
  "criptoforja",
  "grupo_today_os",
] as const;
export type MetaFrente = (typeof META_FRENTES)[number];

export const META_FRENTE_LABEL: Record<MetaFrente, string> = {
  geral: "Geral",
  emerge_financeiro: "Emerge Financeiro",
  emerge_propostas_dev: "Emerge Propostas (dev)",
  criptoforja: "Criptoforja",
  grupo_today_os: "Grupo Today OS",
};

export interface MetaInput {
  periodo: string; // "YYYY-MM"
  frente: MetaFrente;
  meta_valor: number;
  realizado_valor: number;
  meta_status: "draft" | "confirmada";
}
