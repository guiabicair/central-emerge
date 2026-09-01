"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface TaskNodeData {
  titulo: string;
  responsavel: string;
  responsavelCor: string;
  prioridadeLabel: string;
  prioridadeCor: string;
  colunaLabel: string;
  colunaCor: string;
  atrasada: boolean;
  cliente: string;
  onOpen: (id: string) => void;
  [key: string]: unknown;
}

export function TaskNode({ id, data }: NodeProps) {
  const d = data as TaskNodeData;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => d.onOpen(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") d.onOpen(id);
      }}
      className="w-[236px] cursor-pointer rounded-xl border bg-[#141719] px-3 py-2.5 outline-none transition-colors hover:border-[#45f0d1]/50 focus-visible:border-[#45f0d1]"
      style={{ borderColor: d.atrasada ? "#f8717155" : "rgba(255,255,255,0.10)" }}
    >
      <Handle type="target" position={Position.Left} />

      <div className="flex items-start gap-2">
        <span
          className="mt-1 size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: d.prioridadeCor }}
        />
        <span className="line-clamp-2 text-[13px] font-semibold text-[#eef1f0]">
          {d.titulo}
        </span>
      </div>

      <div className="mt-1.5 truncate text-[11px] text-[#8b918f]">
        {d.cliente}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span
          className="rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            color: d.colunaCor,
            borderColor: `${d.colunaCor}44`,
            backgroundColor: `${d.colunaCor}1a`,
          }}
        >
          {d.colunaLabel}
        </span>
        <span
          className="grid size-4 place-items-center rounded-full text-[8px] font-bold"
          style={{
            backgroundColor: `${d.responsavelCor}22`,
            color: d.responsavelCor,
          }}
          title={d.responsavel}
        >
          {d.responsavel}
        </span>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
