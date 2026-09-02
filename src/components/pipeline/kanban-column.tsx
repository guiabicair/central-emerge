import { Plus } from "lucide-react";

import { LeadCard } from "@/components/pipeline/lead-card";
import type { PipelineStage } from "@/lib/pipeline";
import type { Lead } from "@/lib/types";
import { formatCompactCurrency } from "@/lib/utils";

export function KanbanColumn({
  stage,
  leads,
  onOpenLead,
}: {
  stage: PipelineStage;
  leads: Lead[];
  onOpenLead: (id: string) => void;
}) {
  const total = leads.reduce((sum, l) => sum + l.valor, 0);

  return (
    <section className="flex h-full w-[300px] shrink-0 flex-col">
      <header className="mb-3 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: stage.accent }}
          />
          <h3 className="text-sm font-semibold">{stage.label}</h3>
          <span className="text-muted-foreground bg-muted rounded-full px-1.5 text-[11px] font-medium">
            {leads.length}
          </span>
        </div>
        <span className="text-muted-foreground text-[11px]">
          {formatCompactCurrency(total)}
        </span>
      </header>

      <div className="bg-muted/30 flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl p-2">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onOpen={onOpenLead} />
        ))}
        <button
          type="button"
          className="text-muted-foreground hover:border-brand/40 hover:text-foreground flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 py-2 text-xs transition-colors"
        >
          <Plus className="size-3.5" />
          Adicionar lead
        </button>
      </div>
    </section>
  );
}
