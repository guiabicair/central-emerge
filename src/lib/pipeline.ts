import type { LeadTagColor, PipelineStageId } from "@/lib/types";

export interface PipelineStage {
  id: PipelineStageId;
  label: string;
  /** cor de acento (hex) usada nas pills, headers de coluna e nos do canvas */
  accent: string;
  descricao: string;
}

/**
 * As 7 colunas da "Prospeccao Organizada", na ordem do funil.
 * Lead -> 1a Chamada -> Reuniao -> Proposta -> Negociacao -> Fechado / Perdido.
 */
export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "lead",
    label: "Lead",
    accent: "#7c9cff",
    descricao: "Entrou na base, ainda sem contato",
  },
  {
    id: "primeira-chamada",
    label: "1ª Chamada",
    accent: "#38bdf8",
    descricao: "Primeiro contato feito",
  },
  {
    id: "reuniao",
    label: "Reunião",
    accent: "#45f0d1",
    descricao: "Reunião agendada ou realizada",
  },
  {
    id: "proposta",
    label: "Proposta",
    accent: "#c9ff3f",
    descricao: "Proposta enviada",
  },
  {
    id: "negociacao",
    label: "Negociação",
    accent: "#fbbf24",
    descricao: "Ajustes de escopo e preço",
  },
  {
    id: "fechado",
    label: "Fechado",
    accent: "#34d399",
    descricao: "Contrato assinado",
  },
  {
    id: "perdido",
    label: "Perdido",
    accent: "#f87171",
    descricao: "Sem avanço / declinou",
  },
];

export const STAGE_BY_ID: Record<PipelineStageId, PipelineStage> =
  Object.fromEntries(PIPELINE_STAGES.map((s) => [s.id, s])) as Record<
    PipelineStageId,
    PipelineStage
  >;

/** Ordem do funil, sem os terminais, para desenhar a progressao no canvas. */
export const PIPELINE_FLOW_ORDER: PipelineStageId[] = [
  "lead",
  "primeira-chamada",
  "reuniao",
  "proposta",
  "negociacao",
  "fechado",
];

/** Classes utilitarias por cor de tag do card. */
export const TAG_COLOR_CLASSES: Record<LeadTagColor, string> = {
  aqua: "bg-[#45f0d1]/12 text-[#45f0d1] border-[#45f0d1]/25",
  lime: "bg-[#c9ff3f]/12 text-[#c9ff3f] border-[#c9ff3f]/25",
  violet: "bg-[#c98bff]/12 text-[#c98bff] border-[#c98bff]/25",
  blue: "bg-[#7c9cff]/12 text-[#7c9cff] border-[#7c9cff]/25",
  amber: "bg-[#fbbf24]/12 text-[#fbbf24] border-[#fbbf24]/25",
  rose: "bg-[#ff8f6b]/12 text-[#ff8f6b] border-[#ff8f6b]/25",
  slate: "bg-white/8 text-muted-foreground border-white/15",
};
