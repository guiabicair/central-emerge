"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

import { formatCompactCurrency } from "@/lib/utils";

export interface StageNodeData {
  label: string;
  accent: string;
  count: number;
  total: number;
  [key: string]: unknown;
}

export interface LeadNodeData {
  nome: string;
  empresa?: string;
  segmento: string;
  valor: number;
  accent: string;
  tag: string;
  responsavel: string;
  responsavelCor: string;
  [key: string]: unknown;
}

export function StageNode({ data }: NodeProps) {
  const d = data as StageNodeData;
  return (
    <div
      className="w-[240px] rounded-xl border bg-[#0f1112] px-4 py-3"
      style={{ borderColor: `${d.accent}55` }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: d.accent }}
          />
          <span className="text-sm font-semibold text-[#eef1f0]">{d.label}</span>
        </div>
        <span className="rounded-full bg-white/8 px-1.5 text-[11px] text-[#8b918f]">
          {d.count}
        </span>
      </div>
      <div className="mt-1 text-[11px] text-[#8b918f]">
        {formatCompactCurrency(d.total)} em pipeline
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function LeadNode({ data }: NodeProps) {
  const d = data as LeadNodeData;
  return (
    <div className="w-[220px] cursor-pointer rounded-xl border border-white/10 bg-[#141719] px-3 py-2.5 transition-colors hover:border-[#45f0d1]/50">
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2">
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: d.accent }}
        />
        <span className="truncate text-[13px] font-semibold text-[#eef1f0]">
          {d.nome}
        </span>
      </div>
      {d.empresa && (
        <div className="mt-0.5 truncate text-[11px] text-[#8b918f]">
          {d.empresa}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-[#8b918f]">
          {d.segmento}
        </span>
        <span className="text-[12px] font-semibold text-[#45f0d1]">
          {formatCompactCurrency(d.valor)}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span
          className="grid size-4 place-items-center rounded-full text-[8px] font-bold"
          style={{
            backgroundColor: `${d.responsavelCor}22`,
            color: d.responsavelCor,
          }}
        >
          {d.responsavel}
        </span>
        <span className="text-[10px] text-[#8b918f]">{d.tag}</span>
      </div>
    </div>
  );
}
