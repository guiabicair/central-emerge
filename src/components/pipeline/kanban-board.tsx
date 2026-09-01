import { KanbanColumn } from "@/components/pipeline/kanban-column";
import { PIPELINE_STAGES } from "@/lib/pipeline";
import type { Lead } from "@/lib/types";

export function KanbanBoard({ leads }: { leads: Lead[] }) {
  return (
    <div className="flex h-full gap-4 overflow-x-auto px-4 pt-1 pb-4 md:px-6">
      {PIPELINE_STAGES.map((stage) => (
        <KanbanColumn
          key={stage.id}
          stage={stage}
          leads={leads.filter((l) => l.stage === stage.id)}
        />
      ))}
    </div>
  );
}
