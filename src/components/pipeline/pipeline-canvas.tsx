"use client";

import { useMemo } from "react";

import { EntityCanvas } from "@/components/canvas/entity-canvas";
import type { LeadRow } from "@/components/pipeline/pipeline-board";
import type { CanvasSnapshot } from "@/lib/canvas/types";
import { formatCompactCurrency } from "@/lib/utils";

const STAGE_ORDER = [
  "novo",
  "contatado",
  "qualificado",
  "descartado",
  "virou_proposta",
] as const;

const STAGE_DOT: Record<string, string> = {
  novo: "var(--wip)",
  contatado: "var(--data)",
  qualificado: "var(--done)",
  descartado: "var(--ink-muted)",
  virou_proposta: "var(--action)",
};

const COL_W = 300;
const ROW_H = 122;

export function PipelineCanvas({
  leads,
  snapshot,
  canManage,
  onOpenLead,
}: {
  leads: LeadRow[];
  snapshot: CanvasSnapshot;
  canManage: boolean;
  onOpenLead: (id: number) => void;
}) {
  const { nodes, fallbackLayout } = useMemo(() => {
    const perStage: Record<string, number> = {};
    const fallbackLayout: Record<string, { x: number; y: number }> = {};

    const nodes = leads.map((lead) => {
      const col = Math.max(0, STAGE_ORDER.indexOf(lead.status as never));
      const row = (perStage[lead.status] = (perStage[lead.status] ?? 0) + 1) - 1;
      fallbackLayout[String(lead.id)] = { x: col * COL_W, y: row * ROW_H };

      return {
        id: String(lead.id),
        body: (
          <div className="w-[224px] rounded-xl border border-white/10 bg-[#141719] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: STAGE_DOT[lead.status] ?? "var(--wip)" }}
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

    return { nodes, fallbackLayout };
  }, [leads]);

  return (
    <EntityCanvas
      board="pipeline"
      canManage={canManage}
      nodes={nodes}
      fallbackLayout={fallbackLayout}
      snapshot={snapshot}
      onOpenEntity={(id) => onOpenLead(Number(id))}
    />
  );
}
