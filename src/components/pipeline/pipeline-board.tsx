"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  LEAD_FRENTE,
  LEAD_STATUS,
  deleteLead,
  moveLeadStage,
  saveLead,
  type LeadFrente,
  type LeadInput,
  type LeadStatus,
} from "@/app/(app)/pipeline/actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

export interface LeadRow {
  id: number;
  empresa: string;
  frente: string;
  segmento: string | null;
  contato: string | null;
  origem: string | null;
  valor_estimado: number;
  responsavel: string | null;
  status: string;
  motivo_fit: string | null;
  criado_por: string;
  criado_em: string;
}

const COLUMNS: { id: LeadStatus; label: string; dot: string }[] = [
  { id: "novo", label: "Novo", dot: "var(--wip)" },
  { id: "contatado", label: "Contatado", dot: "var(--data)" },
  { id: "qualificado", label: "Qualificado", dot: "var(--done)" },
  { id: "descartado", label: "Descartado", dot: "var(--ink-muted)" },
  { id: "virou_proposta", label: "Virou proposta", dot: "var(--action)" },
];

const FRENTE_LABEL: Record<string, string> = {
  criptoforja: "Criptoforja",
  grupo_today_os: "Grupo Today OS",
  emerge_financeiro: "Emerge Financeiro",
  emerge_propostas_dev: "Emerge Propostas (dev)",
  outro: "Outro",
};

const BLANK: LeadInput = {
  empresa: "",
  frente: "outro",
  segmento: "",
  contato: "",
  origem: "",
  valor_estimado: 0,
  responsavel: "",
  status: "novo",
  motivo_fit: "",
};

function toInput(l: LeadRow): LeadInput {
  return {
    id: l.id,
    empresa: l.empresa,
    frente: (LEAD_FRENTE as readonly string[]).includes(l.frente)
      ? (l.frente as LeadFrente)
      : "outro",
    segmento: l.segmento ?? "",
    contato: l.contato ?? "",
    origem: l.origem ?? "",
    valor_estimado: l.valor_estimado,
    responsavel: l.responsavel ?? "",
    status: (LEAD_STATUS as readonly string[]).includes(l.status)
      ? (l.status as LeadStatus)
      : "novo",
    motivo_fit: l.motivo_fit ?? "",
  };
}

const inputCls =
  "border-line-strong focus:border-data h-9 w-full rounded-md border bg-transparent px-2.5 text-sm outline-none";

function LeadForm({
  initial,
  onClose,
}: {
  initial: LeadInput;
  onClose: () => void;
}) {
  const [form, setForm] = useState<LeadInput>(initial);
  const [pending, start] = useTransition();
  const set = <K extends keyof LeadInput>(k: K, v: LeadInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.empresa.trim()) return toast.error("Empresa é obrigatória.");
        start(async () => {
          try {
            await saveLead(form);
            toast.success(initial.id ? "Lead atualizado" : "Lead criado");
            onClose();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Falhou ao salvar");
          }
        });
      }}
    >
      <SheetHeader className="border-line border-b p-5 pr-12">
        <SheetTitle className="text-base font-semibold">
          {initial.id ? "Editar lead" : "Novo lead"}
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        <label className="block">
          <span className="text-ink-muted text-[11px] font-semibold uppercase">
            Empresa *
          </span>
          <input
            autoFocus
            value={form.empresa}
            onChange={(e) => set("empresa", e.target.value)}
            className={`mt-1 ${inputCls}`}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Frente *
            </span>
            <select
              value={form.frente}
              onChange={(e) => set("frente", e.target.value as LeadFrente)}
              className={`mt-1 ${inputCls}`}
            >
              {LEAD_FRENTE.map((f) => (
                <option key={f} value={f}>
                  {FRENTE_LABEL[f]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Estágio
            </span>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as LeadStatus)}
              className={`mt-1 ${inputCls}`}
            >
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Segmento
            </span>
            <input
              value={form.segmento}
              onChange={(e) => set("segmento", e.target.value)}
              className={`mt-1 ${inputCls}`}
            />
          </label>
          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Valor estimado (R$)
            </span>
            <input
              type="number"
              min={0}
              step={100}
              value={form.valor_estimado ?? 0}
              onChange={(e) => set("valor_estimado", Number(e.target.value))}
              className={`mt-1 ${inputCls}`}
            />
          </label>
        </div>
        <label className="block">
          <span className="text-ink-muted text-[11px] font-semibold uppercase">
            Contato (e-mail ou telefone)
          </span>
          <input
            value={form.contato}
            onChange={(e) => set("contato", e.target.value)}
            className={`mt-1 ${inputCls}`}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Origem
            </span>
            <input
              value={form.origem}
              onChange={(e) => set("origem", e.target.value)}
              className={`mt-1 ${inputCls}`}
            />
          </label>
          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Responsável
            </span>
            <input
              value={form.responsavel}
              onChange={(e) => set("responsavel", e.target.value)}
              className={`mt-1 ${inputCls}`}
            />
          </label>
        </div>
        <label className="block">
          <span className="text-ink-muted text-[11px] font-semibold uppercase">
            Motivo / fit / observações
          </span>
          <textarea
            value={form.motivo_fit}
            onChange={(e) => set("motivo_fit", e.target.value)}
            rows={4}
            className="border-line-strong focus:border-data mt-1 w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none"
          />
        </label>
      </div>

      <div className="border-line flex justify-end gap-2 border-t p-4">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

function DeleteDialog({
  lead,
  onClose,
}: {
  lead: LeadRow;
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
      <div className="border-line bg-surface w-full max-w-sm rounded-xl border p-5">
        <h3 className="text-sm font-semibold">Excluir {lead.empresa}?</h3>
        <p className="text-ink-muted mt-1 text-sm">Não dá pra desfazer.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                try {
                  await deleteLead(lead.id);
                  toast.success("Lead excluído");
                  onClose();
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "Falhou ao excluir",
                  );
                }
              })
            }
          >
            <Trash2 className="size-3.5" />
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  canManage,
  onEdit,
  onDelete,
}: {
  lead: LeadRow;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [, start] = useTransition();

  return (
    <div className="border-line bg-surface rounded-xl border p-3">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={canManage ? onEdit : undefined}
          className="min-w-0 text-left"
        >
          <div className="truncate text-sm font-semibold">{lead.empresa}</div>
          <div className="text-ink-muted truncate text-xs">
            {lead.segmento || FRENTE_LABEL[lead.frente] || lead.frente}
          </div>
        </button>
        {canManage && (
          <div className="flex shrink-0 gap-0.5">
            <Button variant="ghost" size="icon-sm" onClick={onEdit}>
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onDelete}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {lead.contato && (
        <div className="text-ink-muted mt-2 truncate text-xs">{lead.contato}</div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-ink-muted text-[11px]">
          {lead.responsavel || lead.criado_por}
        </span>
        {lead.valor_estimado > 0 && (
          <span className="text-data-text text-xs font-semibold">
            {formatCompactCurrency(lead.valor_estimado)}
          </span>
        )}
      </div>

      {canManage && (
        <select
          value={lead.status}
          onChange={(e) => {
            const status = e.target.value as LeadStatus;
            start(async () => {
              try {
                await moveLeadStage(lead.id, status);
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "Falhou ao mover",
                );
              }
            });
          }}
          className="border-line-strong text-ink-muted mt-2 h-7 w-full rounded-md border bg-transparent px-1.5 text-[11px] outline-none"
        >
          {COLUMNS.map((c) => (
            <option key={c.id} value={c.id}>
              Mover → {c.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function PipelineBoard({
  leads,
  canManage,
  loadError,
}: {
  leads: LeadRow[];
  canManage: boolean;
  loadError: string | null;
}) {
  const [editing, setEditing] = useState<LeadInput | null>(null);
  const [deleting, setDeleting] = useState<LeadRow | null>(null);

  const byColumn = useMemo(() => {
    const map = new Map<string, LeadRow[]>();
    for (const c of COLUMNS) map.set(c.id, []);
    for (const l of leads) {
      (map.get(l.status) ?? map.get("novo"))!.push(l);
    }
    return map;
  }, [leads]);

  const totalValor = leads.reduce((s, l) => s + (l.valor_estimado || 0), 0);

  return (
    <>
      <div className="border-line flex items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
        <span className="text-ink-muted text-xs">
          {leads.length} leads · {formatCurrency(totalValor)} estimado ·{" "}
          <span>gerados pelo Radar + manuais</span>
        </span>
        {canManage && (
          <Button size="sm" onClick={() => setEditing(BLANK)}>
            <Plus className="size-4" />
            Novo lead
          </Button>
        )}
      </div>

      {loadError ? (
        <div className="p-6">
          <div className="border-line bg-surface rounded-2xl border p-6 text-sm">
            <p className="font-medium">Não foi possível carregar o pipeline.</p>
            <p className="text-ink-muted mt-1">
              Rode a migration <code>0006</code> (campos + bridge de RLS de{" "}
              <code>vendas_leads</code>). Detalhe: {loadError}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto p-4 md:p-6">
          {COLUMNS.map((col) => {
            const items = byColumn.get(col.id) ?? [];
            return (
              <section
                key={col.id}
                className="flex w-[280px] shrink-0 flex-col"
              >
                <header className="mb-3 flex items-center gap-2 px-1">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: col.dot }}
                  />
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <span className="bg-surface-2 text-ink-muted rounded-full px-1.5 text-[11px] font-medium">
                    {items.length}
                  </span>
                </header>
                <div className="bg-surface-2/40 flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl p-2">
                  {items.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      canManage={canManage}
                      onEdit={() => setEditing(toInput(lead))}
                      onDelete={() => setDeleting(lead)}
                    />
                  ))}
                  {items.length === 0 && (
                    <p className="text-ink-muted px-2 py-6 text-center text-xs">
                      Vazio
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-[460px]">
          {editing && (
            <LeadForm initial={editing} onClose={() => setEditing(null)} />
          )}
        </SheetContent>
      </Sheet>

      {deleting && (
        <DeleteDialog lead={deleting} onClose={() => setDeleting(null)} />
      )}
    </>
  );
}
