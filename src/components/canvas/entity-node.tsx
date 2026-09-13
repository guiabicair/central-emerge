"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight, Palette, Pencil } from "lucide-react";

import { NODE_COLORS } from "@/lib/canvas/types";

export interface EntityNodeData {
  body: ReactNode;
  onOpen?: (id: string) => void;
  /** permite recolorir o nó (mesma permissão que arrastar/conectar). */
  canManage?: boolean;
  color?: string | null;
  onColorChange?: (id: string, color: string | null) => void;
  /**
   * Nós que representam uma entidade real (tarefa, lead) podem expor um
   * atalho de "renomear" — abre o mesmo editor da entidade (onOpen), só que
   * com um afford explícito em vez de depender do clique no corpo do nó.
   */
  onRename?: (id: string) => void;
  /** presente = o nó pode ser colapsado (esconde os filhos); `collapsed` diz o estado atual. */
  onToggleCollapse?: (id: string) => void;
  collapsed?: boolean;
  [key: string]: unknown;
}

export function EntityNode({ id, data }: NodeProps) {
  const d = data as EntityNodeData;
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!pickerOpen) return;
    const close = () => setPickerOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [pickerOpen]);

  return (
    <div className="relative">
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

      {d.color && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-1.5 -left-1.5 size-3 rounded-full border border-black/40"
          style={{ background: d.color }}
        />
      )}

      {d.canManage && (d.onColorChange || d.onRename || d.onToggleCollapse) && (
        <div className="nodrag absolute -top-2 -right-2 z-10 flex items-center gap-1">
          {d.onToggleCollapse && (
            <button
              type="button"
              title={d.collapsed ? "Expandir" : "Colapsar"}
              onClick={(e) => {
                e.stopPropagation();
                d.onToggleCollapse?.(id);
              }}
              className="flex size-5 items-center justify-center rounded-full border border-white/15 bg-[#141719] text-[#8b918f] opacity-70 shadow-sm transition-opacity hover:opacity-100 hover:text-[#eef1f0]"
            >
              {d.collapsed ? (
                <ChevronRight className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
            </button>
          )}
          {d.onRename && (
            <button
              type="button"
              title="Renomear"
              onClick={(e) => {
                e.stopPropagation();
                d.onRename?.(id);
              }}
              className="flex size-5 items-center justify-center rounded-full border border-white/15 bg-[#141719] text-[#8b918f] opacity-70 shadow-sm transition-opacity hover:opacity-100 hover:text-[#eef1f0]"
            >
              <Pencil className="size-3" />
            </button>
          )}
          {d.onColorChange && (
            <button
              type="button"
              title="Recolorir nó"
              onClick={(e) => {
                e.stopPropagation();
                setPickerOpen((v) => !v);
              }}
              className="flex size-5 items-center justify-center rounded-full border border-white/15 bg-[#141719] text-[#8b918f] opacity-70 shadow-sm transition-opacity hover:opacity-100 hover:text-[#eef1f0]"
            >
              <Palette className="size-3" />
            </button>
          )}
          {pickerOpen && (
            <div
              className="absolute top-6 right-0 flex items-center gap-1 rounded-lg border border-white/10 bg-[#0f1112] p-1.5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {NODE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => {
                    d.onColorChange?.(id, d.color === c ? null : c);
                    setPickerOpen(false);
                  }}
                  className="size-4 rounded-full ring-1 ring-black/30"
                  style={{
                    background: c,
                    outline: d.color === c ? "2px solid #eef1f0" : undefined,
                    outlineOffset: d.color === c ? 1 : undefined,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
