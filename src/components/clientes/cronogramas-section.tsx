"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createCronograma,
  deleteCronograma,
} from "@/app/(app)/clientes/cronograma-actions";
import { TEMPLATE_OPTIONS } from "@/lib/cronogramas/templates";
import type { CronogramaHeader } from "@/lib/cronogramas/queries";
import { Button } from "@/components/ui/button";
import { actionError } from "@/lib/utils";

export function CronogramasSection({
  clientId,
  cronogramas,
  canManage,
}: {
  clientId: string;
  cronogramas: CronogramaHeader[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [tpl, setTpl] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="border-line bg-surface rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">
          Cronogramas{" "}
          <span className="text-ink-muted font-normal">
            ({cronogramas.length})
          </span>
        </h2>
        {canManage && (
          <Button variant="outline" size="xs" onClick={() => setOpen((v) => !v)}>
            <Plus className="size-3.5" />
            Novo
          </Button>
        )}
      </div>

      {open && canManage && (
        <div className="border-line mt-3 space-y-2 rounded-lg border p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título (ou deixe pro template preencher)"
            className="border-line-strong focus:border-data h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none"
          />
          <div className="flex gap-2">
            <select
              value={tpl}
              onChange={(e) => setTpl(e.target.value)}
              className="border-line-strong h-8 flex-1 rounded-md border bg-transparent px-1.5 text-sm outline-none"
            >
              {TEMPLATE_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  try {
                    const r = await createCronograma(clientId, title, tpl);
                    toast.success("Cronograma criado");
                    setOpen(false);
                    setTitle("");
                    setTpl("");
                    router.push(`/clientes/${clientId}/cronograma/${r.id}`);
                  } catch (e) {
                    toast.error(actionError(e, "Falhou ao criar"));
                  }
                })
              }
            >
              Criar
            </Button>
          </div>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {cronogramas.length === 0 && (
          <p className="text-ink-muted text-sm">
            Nenhum cronograma pra este cliente ainda.
          </p>
        )}
        {cronogramas.map((c) => {
          const pct = c.itemCount
            ? Math.round((c.doneCount / c.itemCount) * 100)
            : 0;
          return (
            <div
              key={c.id}
              className="border-line hover:border-data/40 flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors"
            >
              <Link
                href={`/clientes/${clientId}/cronograma/${c.id}`}
                className="min-w-0 flex-1"
              >
                <div className="truncate text-sm font-medium">{c.title}</div>
                <div className="text-ink-muted text-xs">
                  {c.faseCount} fases · {c.doneCount}/{c.itemCount} itens · {pct}%
                </div>
                <div className="bg-surface-2 mt-1.5 h-1 overflow-hidden rounded-full">
                  <div
                    className="bg-data h-full rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Link>
              {canManage && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      if (
                        !window.confirm(`Excluir o cronograma "${c.title}"?`)
                      )
                        return;
                      try {
                        await deleteCronograma(c.id, clientId);
                        toast.success("Cronograma excluído");
                        router.refresh();
                      } catch (e) {
                        toast.error(actionError(e, "Falhou ao excluir"));
                      }
                    })
                  }
                  className="text-ink-muted hover:text-gap shrink-0"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
