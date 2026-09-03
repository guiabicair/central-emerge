"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Link2 } from "lucide-react";
import { toast } from "sonner";

import {
  setCurrentFase,
  setItemDate,
  setItemStatus,
  toggleCheckItem,
} from "@/app/(app)/clientes/cronograma-actions";
import type { CronogramaFull } from "@/lib/cronogramas/queries";
import { Button } from "@/components/ui/button";
import { actionError, formatDate } from "@/lib/utils";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  concluido: { label: "Concluído", cls: "text-done" },
  em_andamento: { label: "Em andamento", cls: "text-wip" },
  agendado: { label: "Agendado", cls: "text-data-text" },
  a_fazer: { label: "A fazer", cls: "text-ink-muted" },
};
const STATUS_KEYS = ["a_fazer", "agendado", "em_andamento", "concluido"];

export function CronogramaView({
  crono,
  canManage,
}: {
  crono: CronogramaFull;
  canManage: boolean;
}) {
  const clientId = crono.clientId ?? "";
  const [, start] = useTransition();

  const totalItems = crono.fases.reduce((s, f) => s + f.itemsWithId.length, 0);
  const doneItems = crono.fases.reduce(
    (s, f) => s + f.itemsWithId.filter((i) => i.status === "concluido").length,
    0,
  );
  const pct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      try {
        await fn();
      } catch (e) {
        toast.error(actionError(e, "Falhou"));
      }
    });

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/c/${crono.shareToken}`
      : `/c/${crono.shareToken}`;

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
      <Link
        href={`/clientes/${clientId}`}
        className="text-ink-muted hover:text-ink inline-flex items-center gap-1 text-xs"
      >
        <ArrowLeft className="size-3.5" />
        Voltar ao cliente
      </Link>

      <div className="border-line bg-surface rounded-2xl border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{crono.title}</h1>
            {crono.description && (
              <p className="text-ink-muted mt-0.5 text-sm">{crono.description}</p>
            )}
            <p className="text-ink-muted mt-1 text-xs">
              {crono.startDate ? formatDate(crono.startDate) : "sem início"}
              {" → "}
              {crono.endDate ? formatDate(crono.endDate) : "sem fim"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(shareUrl);
              toast.success("Link público copiado");
            }}
            className="border-line hover:border-data/40 text-ink-muted hover:text-ink inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"
          >
            <Link2 className="size-3.5" />
            Copiar link público
          </button>
        </div>

        <div className="mt-3">
          <div className="text-ink-muted flex items-center justify-between text-[11px]">
            <span>
              {doneItems}/{totalItems} itens
            </span>
            <span>{pct}%</span>
          </div>
          <div className="bg-surface-2 mt-1 h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-data h-full rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {crono.fases.length > 0 && (
          <label className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-ink-muted">Estamos aqui agora:</span>
            <select
              value={crono.currentFaseId ?? ""}
              disabled={!canManage}
              onChange={(e) =>
                run(() => setCurrentFase(crono.id, clientId, e.target.value))
              }
              className="border-line-strong h-7 rounded-md border bg-transparent px-1.5 text-xs outline-none"
            >
              {crono.fases.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* fases */}
      {crono.fases.map((f) => (
        <div
          key={f.id}
          className={`border-line bg-surface rounded-2xl border p-4 ${
            f.id === crono.currentFaseId ? "ring-data/40 ring-1" : ""
          }`}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">
              {f.title}
              {f.id === crono.currentFaseId && (
                <span className="text-data-text ml-2 text-[11px]">
                  · agora
                </span>
              )}
            </h2>
            {f.intervalLabel && (
              <span className="text-ink-muted text-xs">{f.intervalLabel}</span>
            )}
          </div>
          {f.note && (
            <p className="text-ink-muted mt-1 text-xs">{f.note}</p>
          )}
          <div className="mt-3 space-y-1.5">
            {f.itemsWithId.length === 0 && (
              <p className="text-ink-muted text-xs">Sem itens.</p>
            )}
            {f.itemsWithId.map((it) => (
              <div
                key={it.id}
                className="border-line flex flex-wrap items-center gap-2 rounded-lg border p-2.5"
              >
                <span className="min-w-0 flex-1 text-sm">{it.text}</span>
                {it.taskId && (
                  <Link
                    href="/tarefas"
                    className="text-data-text text-[11px] hover:underline"
                  >
                    task ↗
                  </Link>
                )}
                <input
                  type="date"
                  value={it.date ?? ""}
                  disabled={!canManage}
                  onChange={(e) =>
                    run(() =>
                      setItemDate(
                        it.id,
                        crono.id,
                        clientId,
                        e.target.value || null,
                      ),
                    )
                  }
                  className="border-line-strong h-7 rounded-md border bg-transparent px-1.5 text-[11px] outline-none"
                />
                <select
                  value={it.status}
                  disabled={!canManage}
                  onChange={(e) =>
                    run(() =>
                      setItemStatus(
                        it.id,
                        crono.id,
                        clientId,
                        e.target.value,
                      ),
                    )
                  }
                  className={`border-line-strong h-7 rounded-md border bg-transparent px-1.5 text-[11px] outline-none ${
                    STATUS_META[it.status]?.cls ?? ""
                  }`}
                >
                  {STATUS_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {STATUS_META[k].label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* checklists */}
      {crono.checklists.map((cl) => (
        <div key={cl.id} className="border-line bg-surface rounded-2xl border p-4">
          <h2 className="text-sm font-semibold">
            {cl.title}{" "}
            <span className="text-ink-muted font-normal">
              {cl.itemsWithId.filter((i) => i.done).length}/
              {cl.itemsWithId.length}
            </span>
          </h2>
          <div className="mt-2 space-y-1">
            {cl.itemsWithId.map((i) => (
              <label
                key={i.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={i.done}
                  disabled={!canManage}
                  onChange={() =>
                    run(() =>
                      toggleCheckItem(i.id, crono.id, clientId, !i.done),
                    )
                  }
                  className="accent-[var(--data)]"
                />
                <span className={i.done ? "text-ink-muted line-through" : ""}>
                  {i.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* seções de conteúdo */}
      {crono.secoes.map((s) => (
        <div key={s.id} className="border-line bg-surface rounded-2xl border p-4">
          <h2 className="text-sm font-semibold">{s.title}</h2>
          <div className="mt-2 space-y-2">
            {s.blocks.map((b, i) => (
              <div key={i} className="border-line rounded-lg border p-2.5">
                <div className="text-sm font-medium">{b.heading}</div>
                {b.meta && (
                  <div className="text-ink-muted text-[11px]">{b.meta}</div>
                )}
                {b.notes.length > 0 && (
                  <ul className="text-ink-muted mt-1 list-disc space-y-0.5 pl-4 text-xs">
                    {b.notes.map((n, j) => (
                      <li key={j}>{n}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
