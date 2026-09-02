import type { PillColor } from "@/components/status-pill";
import type { Proposal, ProposalStatus } from "@/lib/types";

export const PROPOSAL_STATUS_META: Record<
  ProposalStatus,
  { label: string; color: PillColor }
> = {
  rascunho: { label: "Rascunho", color: "slate" },
  enviada: { label: "Enviada", color: "blue" },
  visualizada: { label: "Visualizada", color: "violet" },
  aceita: { label: "Aceita", color: "green" },
  recusada: { label: "Recusada", color: "rose" },
  expirada: { label: "Expirada", color: "amber" },
};

/** status que contam como "já saiu para o cliente" */
const ENVIADAS: ProposalStatus[] = [
  "enviada",
  "visualizada",
  "aceita",
  "recusada",
  "expirada",
];

export interface ProposalStats {
  total: number;
  enviadas: number;
  aceitas: number;
  taxaAceite: number;
  valorAtivas: number;
  valorFechado: number;
}

export function proposalStats(proposals: Proposal[]): ProposalStats {
  const enviadas = proposals.filter((p) => ENVIADAS.includes(p.status));
  const aceitas = proposals.filter((p) => p.status === "aceita");
  const ativas = proposals.filter(
    (p) => p.status === "enviada" || p.status === "visualizada",
  );

  return {
    total: proposals.length,
    enviadas: enviadas.length,
    aceitas: aceitas.length,
    taxaAceite: enviadas.length ? aceitas.length / enviadas.length : 0,
    valorAtivas: ativas.reduce((s, p) => s + p.valor, 0),
    valorFechado: aceitas.reduce((s, p) => s + p.valor, 0),
  };
}

/** ordem de exibição: mais “quentes” primeiro */
const STATUS_RANK: Record<ProposalStatus, number> = {
  visualizada: 0,
  enviada: 1,
  aceita: 2,
  rascunho: 3,
  recusada: 4,
  expirada: 5,
};

export function sortProposals(proposals: Proposal[]): Proposal[] {
  return [...proposals].sort((a, b) => {
    const r = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (r !== 0) return r;
    return b.criadaEm.localeCompare(a.criadaEm);
  });
}
