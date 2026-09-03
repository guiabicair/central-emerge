"use client";

import type { ReactNode } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface EntityNodeData {
  body: ReactNode;
  onOpen?: (id: string) => void;
  [key: string]: unknown;
}

export function EntityNode({ id, data }: NodeProps) {
  const d = data as EntityNodeData;
  return (
    <div
      role={d.onOpen ? "button" : undefined}
      tabIndex={d.onOpen ? 0 : undefined}
      onClick={() => d.onOpen?.(id)}
      onKeyDown={(e) => {
        if (d.onOpen && (e.key === "Enter" || e.key === " ")) d.onOpen(id);
      }}
      className={d.onOpen ? "cursor-pointer outline-none" : "outline-none"}
    >
      <Handle type="target" position={Position.Left} />
      {d.body}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
