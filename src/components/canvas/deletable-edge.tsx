"use client";

import { X } from "lucide-react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

/**
 * Aresta manual com botão de remover no meio do traço. O atalho de teclado
 * (Delete) do React Flow é irregular dependendo de onde está o foco — o botão
 * é o caminho garantido. `data.onDelete(id)` vem do EntityCanvas.
 */
export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  selected,
  data,
}: EdgeProps) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const onDelete = (data as { onDelete?: (id: string) => void } | undefined)
    ?.onDelete;

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {onDelete && (
        <EdgeLabelRenderer>
          <button
            type="button"
            aria-label="Remover conexão"
            className={`nodrag nopan pointer-events-auto grid size-[18px] place-items-center rounded-full border border-white/15 bg-[#0f1112] text-[#8b918f] transition-colors hover:border-rose-400/60 hover:text-rose-300 ${
              selected ? "border-white/40 text-[#eef1f0]" : ""
            }`}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
          >
            <X className="size-3" />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
