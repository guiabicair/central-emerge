import { ExternalLink, Plus } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { ProposalsTable } from "@/components/propostas/proposals-table";
import { StatTile } from "@/components/stat-tile";
import { PROPOSALS } from "@/lib/mock-data";
import { proposalStats } from "@/lib/proposals";
import { formatCompactCurrency } from "@/lib/utils";

export const metadata = { title: "Propostas · Central Emerge" };

const ADMIN_URL = "https://emerge-propostas.vercel.app/admin";

export default function PropostasPage() {
  const stats = proposalStats(PROPOSALS);

  return (
    <>
      <Topbar
        title="Propostas"
        description="Espelho do gerador — emerge-propostas.vercel.app"
      />

      <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label="Total de propostas" value={stats.total} />
            <StatTile
              label="Taxa de aceite"
              value={`${Math.round(stats.taxaAceite * 100)}%`}
              hint={`${stats.aceitas}/${stats.enviadas} enviadas`}
              accent="done"
            />
            <StatTile
              label="Em propostas ativas"
              value={formatCompactCurrency(stats.valorAtivas)}
              hint="enviada + visualizada"
            />
            <StatTile
              label="Valor fechado"
              value={formatCompactCurrency(stats.valorFechado)}
              hint="propostas aceitas"
              accent="data"
            />
          </div>

          <div className="flex flex-col items-end gap-1">
            <a
              href={ADMIN_URL}
              target="_blank"
              rel="noreferrer"
              className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium"
            >
              <Plus className="size-4" />
              Nova Proposta
              <ExternalLink className="size-3.5 opacity-70" />
            </a>
            <p className="text-muted-foreground max-w-[220px] text-right text-[11px]">
              Criação ainda acontece no painel do gerador — em breve direto por
              aqui.
            </p>
          </div>
        </div>

        <ProposalsTable proposals={PROPOSALS} />
      </div>
    </>
  );
}
