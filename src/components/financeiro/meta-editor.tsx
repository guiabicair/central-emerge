"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { upsertMeta } from "@/app/(app)/financeiro/actions";
import {
  META_FRENTES,
  META_FRENTE_LABEL,
  type MetaFrente,
} from "@/app/(app)/financeiro/meta-constants";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { actionError, formatCurrency } from "@/lib/utils";

export interface MetaVal {
  periodo: string;
  frente: string;
  meta: number;
  realizado: number;
  status: string;
}

interface RowState {
  meta: string;
  real: string;
  status: "draft" | "confirmada";
}

/** key={periodo} no pai → remonta e re-semeia ao trocar de período. */
export function MetaEditor({
  periodo,
  metas,
  canManage,
}: {
  periodo: string;
  metas: MetaVal[];
  canManage: boolean;
}) {
  const seed = () => {
    const map: Record<string, RowState> = {};
    for (const fr of META_FRENTES) {
      const found = metas.find((m) => m.frente === fr);
      map[fr] = {
        meta: String(found?.meta ?? 0),
        real: String(found?.realizado ?? 0),
        status: found?.status === "confirmada" ? "confirmada" : "draft",
      };
    }
    return map;
  };
  const [rows, setRows] = useState<Record<string, RowState>>(seed);
  const [savingFrente, setSavingFrente] = useState<string | null>(null);
  const [, start] = useTransition();

  const totalMeta = META_FRENTES.reduce(
    (s, fr) => s + (Number(rows[fr]?.meta) || 0),
    0,
  );
  const totalReal = META_FRENTES.reduce(
    (s, fr) => s + (Number(rows[fr]?.real) || 0),
    0,
  );

  const setRow = (fr: string, patch: Partial<RowState>) =>
    setRows((r) => ({ ...r, [fr]: { ...r[fr]!, ...patch } }));

  const save = (fr: MetaFrente) => {
    const row = rows[fr]!;
    setSavingFrente(fr);
    start(async () => {
      try {
        await upsertMeta({
          periodo,
          frente: fr,
          meta_valor: Number(row.meta) || 0,
          realizado_valor: Number(row.real) || 0,
          meta_status: row.status,
        });
        toast.success(`Meta de ${META_FRENTE_LABEL[fr]} salva`);
      } catch (e) {
        toast.error(actionError(e, "Falhou ao salvar meta"));
      } finally {
        setSavingFrente(null);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="border-line rounded-lg border p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-muted">Total do período</span>
          <span className="font-semibold">
            {formatCurrency(totalReal)} / {formatCurrency(totalMeta)}
          </span>
        </div>
        <div className="bg-surface-2 mt-2 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-data h-full rounded-full"
            style={{
              width: `${
                totalMeta ? Math.min(100, (totalReal / totalMeta) * 100) : 0
              }%`,
            }}
          />
        </div>
      </div>

      {META_FRENTES.map((fr) => {
        const row = rows[fr]!;
        const meta = Number(row.meta) || 0;
        const real = Number(row.real) || 0;
        return (
          <div key={fr} className="border-line rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{META_FRENTE_LABEL[fr]}</span>
              <StatusPill color={row.status === "confirmada" ? "green" : "slate"}>
                {row.status === "confirmada" ? "Confirmada" : "Rascunho"}
              </StatusPill>
            </div>

            {canManage ? (
              <>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-ink-muted text-[10px] uppercase">
                      Meta (R$)
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.meta}
                      onChange={(e) => setRow(fr, { meta: e.target.value })}
                      className="border-line-strong focus:border-data mt-0.5 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-ink-muted text-[10px] uppercase">
                      Realizado (R$)
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.real}
                      onChange={(e) => setRow(fr, { real: e.target.value })}
                      className="border-line-strong focus:border-data mt-0.5 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none"
                    />
                  </label>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <select
                    value={row.status}
                    onChange={(e) =>
                      setRow(fr, {
                        status: e.target.value as "draft" | "confirmada",
                      })
                    }
                    className="border-line-strong h-8 rounded-md border bg-transparent px-1.5 text-xs outline-none"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="confirmada">Confirmada</option>
                  </select>
                  <Button
                    size="xs"
                    disabled={savingFrente === fr}
                    onClick={() => save(fr)}
                  >
                    {savingFrente === fr ? "Salvando…" : "Salvar"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-ink-muted mt-1.5 text-sm">
                {formatCurrency(real)} / {formatCurrency(meta)}
              </div>
            )}

            {meta > 0 && (
              <div className="bg-surface-2 mt-2 h-1 overflow-hidden rounded-full">
                <div
                  className="bg-data h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (real / meta) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
