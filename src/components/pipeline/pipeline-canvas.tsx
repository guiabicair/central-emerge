"use client";

import { useMemo, useState } from "react";

import { colDot, colLabel, type StatusCol } from "@/app/(app)/pipeline/lead-constants";
import { EntityCanvas } from "@/components/canvas/entity-canvas";
import type { LeadRow } from "@/components/pipeline/pipeline-board";
import type { CanvasSnapshot } from "@/lib/canvas/types";
import { formatCompactCurrency } from "@/lib/utils";

const COL_W = 300;
const ROW_H = 122;

export function PipelineCanvas({
  leads,
  statuses,
  snapshot,
  canManage,
  onOpenLead,
}: {
  leads: LeadRow[];
  statuses: StatusCol[];
  snapshot: CanvasSnapshot;
  canManage: boolean;
  onOpenLead: (id: number) => void;
}) {
  const cols = useMemo(
    () => [...statuses].sort((a, b) => a.position - b.position),
    [statuses],
  );

  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set());
  const toggleStageCollapse = (id: string) => {
    const name = id.startsWith("__stage_") ? id.slice("__stage_".length) : id;
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const { nodes, fallbackLayout } = useMemo(() => {
    const colIndex = new Map(cols.map((c, i) => [c.name, i]));
    const perStage: Record<string, number> = {};
    const fallbackLayout: Record<string, { x: number; y: number }> = {};

    const headerNodes = cols.map((c, i) => {
      const id = `__stage_${c.name}`;
      const collapsed = collapsedStages.has(c.name);
      fallbackLayout[id] = { x: i * COL_W, y: -90 };
      const count = leads.filter((l) => l.status === c.name).length;
      return {
        id,
        draggable: false,
        connectable: false,
        collapsed,
        body: (
          <div className="flex w-[224px] items-center gap-2 rounded-lg border border-white/10 bg-[#1b1e20] px-3 py-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: colDot(c.color) }}
            />
            <span className="truncate text-[12px] font-semibold text-[#eef1f0]">
              {colLabel(c.name)}
            </span>
            <span className="ml-auto text-[11px] text-[#8b918f]">{count}</span>
          </div>
        ),
      };
    });

    const nodes = leads.filter((l) => !collapsedStages.has(l.status)).map((lead) => {
      const col = colIndex.get(lead.status) ?? 0;
      const row = (perStage[lead.status] = (perStage[lead.status] ?? 0) + 1) - 1;
      fallbackLayout[String(lead.id)] = { x: col * COL_W, y: row * ROW_H };
      const statusCol = cols.find((c) => c.name === lead.status);

      return {
        id: String(lead.id),
        renamable: true,
        searchText: [
          lead.empresa,
          lead.contato,
          lead.responsavel,
          lead.criado_por,
          statusCol ? colLabel(statusCol.name) : lead.status,
        ]
          .filter(Boolean)
          .join(" "),
        body: (
          <div className="w-[224px] rounded-xl border border-white/10 bg-[#141719] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: statusCol ? colDot(statusCol.color) : "var(--ink-muted)",
                }}
              />
              <span className="truncate text-[13px] font-semibold text-[#eef1f0]">
                {lead.empresa}
              </span>
            </div>
            {lead.contato && (
              <div className="mt-1 truncate text-[11px] text-[#8b918f]">
                {lead.contato}
              </div>
            )}
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-[#8b918f]">
                {lead.responsavel || lead.criado_por}
              </span>
              {lead.valor_estimado > 0 && (
                <span className="font-semibold text-[#45f0d1]">
                  {formatCompactCurrency(lead.valor_estimado)}
                </span>
              )}
            </div>
          </div>
        ),
      };
    });

    return { nodes: [...headerNodes, ...nodes], fallbackLayout };
  }, [leads, cols, collapsedStages]);

  return (
    <EntityCanvas
      board="pipeline"
      canManage={canManage}
      nodes={nodes}
      fallbackLayout={fallbackLayout}
      snapshot={snapshot}
      onOpenEntity={(id) => onOpenLead(Number(id))}
      onRenameEntity={(id) => onOpenLead(Number(id))}
      onToggleCollapse={toggleStageCollapse}
    />
  );
}
