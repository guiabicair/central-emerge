"use client";

import { useState, useTransition } from "react";
import { Wallet, Repeat, Target } from "lucide-react";
import { toast } from "sonner";

import { adjustCash } from "@/app/(app)/financeiro/actions";
import { FinanceChart } from "@/components/financeiro/finance-chart";
import { MetaEditor, type MetaVal } from "@/components/financeiro/meta-editor";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { actionError, formatCurrency, formatDate, relativeDate } from "@/lib/utils";

type Drill = "caixa" | "mrr" | "meta" | null;

interface Meta {
  valor: number;
  realizado: number;
  entradasMes: number;
  status: string;
  frentes: { frente: string; meta: number; realizado: number }[];
}

interface Props {
  loadError: string | null;
  canView: boolean;
  canManage: boolean;
  caixaHoje: number | null;
  mrr: number;
  meta: Meta | null;
  allMetas: MetaVal[];
  metaPeriods: string[];
  chart: { mes: string; entradas: number; saidas: number }[];
  chartHasData: boolean;
  recurring: {
    id: string;
    title: string;
    monthlyAmount: number;
    startDate: string;
    endDate: string | null;
    clientName: string;
  }[];
  cashHistory: {
    id: string;
    amount: number;
    description: string | null;
    who: string;
    when: string;
  }[];
  periodo: string;
}

function Tile({
  icon: Icon,
  label,
  value,
  hint,
  onClick,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-line bg-surface hover:border-data/40 rounded-2xl border p-4 text-left transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-ink-muted text-xs">{label}</span>
        <span className="bg-surface-2 text-ink-muted grid size-7 place-items-center rounded-lg">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="text-ink-muted mt-0.5 text-xs">
        {hint ?? "ver detalhe"}
      </div>
    </button>
  );
}

function AdjustCashModal({
  current,
  onClose,
}: {
  current: number;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(current));
  const [motivo, setMotivo] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
      <div className="border-line bg-surface w-full max-w-sm rounded-xl border p-5">
        <h3 className="text-sm font-semibold">Ajustar caixa</h3>
        <p className="text-ink-muted mt-1 text-xs">
          Registra um valor novo. Fica no histórico com seu nome e a data.
        </p>

        <label className="mt-3 block">
          <span className="text-ink-muted text-[11px] font-semibold tracking-wide uppercase">
            Novo valor (R$)
          </span>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border-line-strong focus:border-data mt-1 h-9 w-full rounded-md border bg-transparent px-2.5 text-sm outline-none"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-ink-muted text-[11px] font-semibold tracking-wide uppercase">
            Motivo
          </span>
          <input
            autoFocus
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Conciliação de agosto…"
            className="border-line-strong focus:border-data mt-1 h-9 w-full rounded-md border bg-transparent px-2.5 text-sm outline-none"
          />
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                try {
                  await adjustCash({ amount: Number(amount), motivo });
                  toast.success("Caixa ajustado");
                  onClose();
                } catch (err) {
                  toast.error(
                    actionError(err, "Falhou ao ajustar"),
                  );
                }
              })
            }
          >
            {pending ? "Salvando…" : "Confirmar ajuste"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FinanceView(props: Props) {
  const [drill, setDrill] = useState<Drill>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [metaPeriodo, setMetaPeriodo] = useState(props.periodo);

  if (props.loadError) {
    return (
      <div className="border-line bg-surface rounded-2xl border p-6 text-sm">
        <p className="font-medium">Não foi possível carregar o financeiro.</p>
        <p className="text-ink-muted mt-1">
          Rode as migrations <code>0003</code>–<code>0005</code> (campos de
          cliente + bridges de RLS). Detalhe: {props.loadError}
        </p>
      </div>
    );
  }

  if (!props.canView) {
    return (
      <div className="border-line bg-surface rounded-2xl border p-6 text-sm">
        Você não tem acesso ao financeiro.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile
          icon={Wallet}
          label="Caixa hoje"
          value={props.caixaHoje != null ? formatCurrency(props.caixaHoje) : "—"}
          hint={
            props.cashHistory[0]
              ? `atualizado ${relativeDate(props.cashHistory[0].when)}`
              : "sem registro"
          }
          onClick={() => setDrill("caixa")}
        />
        <Tile
          icon={Repeat}
          label="MRR"
          value={formatCurrency(props.mrr)}
          hint={`${props.recurring.length} contratos ativos`}
          onClick={() => setDrill("mrr")}
        />
        <Tile
          icon={Target}
          label="Meta do mês"
          value={props.meta ? formatCurrency(props.meta.valor) : "definir meta"}
          hint={
            props.meta
              ? `realizado ${formatCurrency(props.meta.realizado)}${
                  props.meta.status === "confirmada" ? "" : " · rascunho"
                }`
              : `vendas_metas · ${props.periodo}`
          }
          onClick={() => setDrill("meta")}
        />
      </div>

      <div className="border-line bg-surface rounded-2xl border p-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold">Entradas × saídas por mês</h3>
          <span className="text-ink-muted text-xs">últimos 6 meses</span>
        </div>
        <div className="mt-3">
          {props.chartHasData ? (
            <FinanceChart data={props.chart} />
          ) : (
            <p className="text-ink-muted py-10 text-center text-sm">
              Ainda não há movimentações suficientes nos últimos 6 meses. O
              gráfico aparece quando houver pagamentos de projetos e despesas
              lançados.
            </p>
          )}
        </div>
      </div>

      <Sheet open={drill !== null} onOpenChange={(o) => !o && setDrill(null)}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-[460px]">
          <div className="flex h-full flex-col">
            {drill === "caixa" && (
              <>
                <SheetHeader className="border-line border-b p-5 pr-12">
                  <SheetTitle className="text-base font-semibold">
                    Caixa — histórico de ajustes
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 space-y-2 overflow-y-auto p-5">
                  {props.canManage && (
                    <Button
                      size="sm"
                      className="mb-2"
                      onClick={() => setAdjusting(true)}
                    >
                      Ajustar caixa
                    </Button>
                  )}
                  {props.cashHistory.length === 0 && (
                    <p className="text-ink-muted text-sm">Nenhum registro.</p>
                  )}
                  {props.cashHistory.map((h, i) => (
                    <div
                      key={h.id}
                      className="border-line rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {formatCurrency(h.amount)}
                        </span>
                        {i === 0 && <StatusPill color="green">atual</StatusPill>}
                      </div>
                      <div className="text-ink-muted mt-1 text-xs">
                        {h.description || "—"}
                      </div>
                      <div className="text-ink-muted mt-1 text-[11px]">
                        {h.who} · {formatDate(h.when)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {drill === "mrr" && (
              <>
                <SheetHeader className="border-line border-b p-5 pr-12">
                  <SheetTitle className="text-base font-semibold">
                    MRR — contratos recorrentes ativos
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 space-y-2 overflow-y-auto p-5">
                  {props.recurring.length === 0 && (
                    <p className="text-ink-muted text-sm">
                      Nenhum contrato recorrente ativo. Rode o seed do item
                      Clientes.
                    </p>
                  )}
                  {props.recurring.map((r) => (
                    <div
                      key={r.id}
                      className="border-line flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <div className="text-sm font-medium">{r.clientName}</div>
                        <div className="text-ink-muted text-xs">
                          {r.title} · desde {formatDate(r.startDate)}
                        </div>
                      </div>
                      <span className="text-data-text font-semibold">
                        {formatCurrency(r.monthlyAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {drill === "meta" && (
              <>
                <SheetHeader className="border-line border-b p-5 pr-12">
                  <SheetTitle className="text-base font-semibold">
                    Metas por frente
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  <label className="block">
                    <span className="text-ink-muted text-[11px] font-semibold uppercase">
                      Período
                    </span>
                    <select
                      value={metaPeriodo}
                      onChange={(e) => setMetaPeriodo(e.target.value)}
                      className="border-line-strong mt-1 h-9 w-full rounded-md border bg-transparent px-2.5 text-sm outline-none"
                    >
                      {props.metaPeriods.map((p) => (
                        <option key={p} value={p}>
                          {p}
                          {p === props.periodo ? " (atual)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <MetaEditor
                    key={metaPeriodo}
                    periodo={metaPeriodo}
                    metas={props.allMetas.filter(
                      (m) => m.periodo === metaPeriodo,
                    )}
                    canManage={props.canManage}
                  />

                  {metaPeriodo === props.periodo && (
                    <p className="text-ink-muted text-[11px]">
                      Referência — entradas da empresa no mês:{" "}
                      {formatCurrency(props.meta?.entradasMes ?? 0)} (não é o
                      realizado das metas; é o total de recorrentes + pagos).
                    </p>
                  )}
                  {!props.canManage && (
                    <p className="text-ink-muted text-[11px]">
                      Você não tem <code>financeiro.manage</code> — metas em
                      modo leitura.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {adjusting && (
        <AdjustCashModal
          current={props.caixaHoje ?? 0}
          onClose={() => setAdjusting(false)}
        />
      )}
    </div>
  );
}
