"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { actionError } from "@/lib/utils";

export interface ManagedStatusCol {
  id: string;
  name: string;
  color: string;
  position: number;
}

/**
 * Gerenciador de colunas genérico — reaproveitado por Tarefas e Pipeline
 * (mesmo padrão de status dinâmico: tabela própria + create/rename/color/
 * move/delete). Cada board passa suas próprias server actions e paleta.
 */
export function ColumnManager({
  cols,
  colors,
  title,
  itemLabel,
  colLabel = (name) => name,
  colDot,
  onClose,
  actions,
}: {
  cols: ManagedStatusCol[];
  colors: readonly string[];
  title: string;
  /** substantivo do que é reatribuído ao excluir uma coluna, ex: "tarefas", "leads" */
  itemLabel: string;
  colLabel?: (name: string) => string;
  colDot: (color: string) => string;
  onClose: () => void;
  actions: {
    createStatus: (name: string, color: string) => Promise<void>;
    renameStatus: (id: string, name: string) => Promise<void>;
    setStatusColor: (id: string, color: string) => Promise<void>;
    moveStatus: (id: string, dir: "up" | "down") => Promise<void>;
    deleteStatus: (id: string, reassignToName: string) => Promise<void>;
  };
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>(
    () => Object.fromEntries(cols.map((c) => [c.id, c.name])),
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dest, setDest] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(colors[0] ?? "slate");

  const run = (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    start(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        toast.error(actionError(e, "Falhou"));
      } finally {
        setBusy(null);
      }
    });
  };

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-line border-b p-5 pr-12">
        <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
      </SheetHeader>

      <div className="flex-1 space-y-2 overflow-y-auto p-5">
        {cols.map((c, i) => (
          <div key={c.id} className="border-line rounded-lg border p-2.5">
            <div className="flex items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: colDot(c.color) }}
              />
              <input
                value={names[c.id] ?? c.name}
                onChange={(e) =>
                  setNames((n) => ({ ...n, [c.id]: e.target.value }))
                }
                onBlur={() => {
                  const v = (names[c.id] ?? "").trim();
                  if (v && v !== c.name)
                    run(`name:${c.id}`, () => actions.renameStatus(c.id, v));
                }}
                className="border-line-strong focus:border-data h-8 flex-1 rounded-md border bg-transparent px-2 text-sm outline-none"
              />
              <select
                value={c.color}
                onChange={(e) =>
                  run(`color:${c.id}`, () =>
                    actions.setStatusColor(c.id, e.target.value),
                  )
                }
                className="border-line-strong h-8 rounded-md border bg-transparent px-1 text-xs outline-none"
              >
                {colors.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={i === 0 || busy !== null}
                onClick={() =>
                  run(`up:${c.id}`, () => actions.moveStatus(c.id, "up"))
                }
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={i === cols.length - 1 || busy !== null}
                onClick={() =>
                  run(`down:${c.id}`, () => actions.moveStatus(c.id, "down"))
                }
              >
                <ArrowDown className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={cols.length <= 1}
                onClick={() => {
                  setDeletingId(deletingId === c.id ? null : c.id);
                  setDest(cols.find((x) => x.id !== c.id)?.name ?? "");
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            {deletingId === c.id && (
              <div className="border-line mt-2 flex items-center gap-2 border-t pt-2 text-[11px]">
                <span className="text-ink-muted">Mover {itemLabel} para</span>
                <select
                  value={dest}
                  onChange={(e) => setDest(e.target.value)}
                  className="border-line-strong h-7 flex-1 rounded-md border bg-transparent px-1.5 outline-none"
                >
                  {cols
                    .filter((x) => x.id !== c.id)
                    .map((x) => (
                      <option key={x.id} value={x.name}>
                        {colLabel(x.name)}
                      </option>
                    ))}
                </select>
                <Button
                  variant="destructive"
                  size="xs"
                  disabled={busy !== null || !dest}
                  onClick={() =>
                    run(`del:${c.id}`, async () => {
                      await actions.deleteStatus(c.id, dest);
                      setDeletingId(null);
                    })
                  }
                >
                  Excluir
                </Button>
              </div>
            )}
          </div>
        ))}

        <div className="border-line mt-3 rounded-lg border border-dashed p-2.5">
          <span className="text-ink-muted text-[11px] font-semibold uppercase">
            Nova coluna
          </span>
          <div className="mt-1.5 flex items-center gap-1.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Bloqueado"
              className="border-line-strong focus:border-data h-8 flex-1 rounded-md border bg-transparent px-2 text-sm outline-none"
            />
            <select
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="border-line-strong h-8 rounded-md border bg-transparent px-1 text-xs outline-none"
            >
              {colors.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={busy !== null || !newName.trim()}
              onClick={() =>
                run("create", async () => {
                  await actions.createStatus(newName, newColor);
                  setNewName("");
                })
              }
            >
              Criar
            </Button>
          </div>
        </div>
      </div>

      <div className="border-line flex justify-end border-t p-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}
