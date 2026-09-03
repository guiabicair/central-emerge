"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { DragEvent } from "react";
import dynamic from "next/dynamic";
import {
  ExternalLink,
  GripVertical,
  KanbanSquare,
  Pencil,
  Plus,
  Trash2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";

import {
  closeDealCreateClient,
  deleteLead,
  moveLeadStage,
  saveLead,
} from "@/app/(app)/pipeline/actions";
import {
  LEAD_FRENTE,
  LEAD_STATUS,
  type LeadFrente,
  type LeadInput,
  type LeadStatus,
} from "@/app/(app)/pipeline/lead-constants";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CanvasSnapshot } from "@/lib/canvas/types";
import { actionError, formatCompactCurrency, formatCurrency } from "@/lib/utils";

const PipelineCanvas = dynamic(
  () =>
    import("@/components/pipeline/pipeline-canvas").then((m) => m.PipelineCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="text-ink-muted grid h-full place-items-center text-sm">
        Carregando canvas…
      </div>
    ),
  },
);

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
  proposta_slug: string | null;
  criado_por: string;
  criado_em: string;
}

const COLUMNS: {
  id: LeadStatus;
  label: string;
  dot: string;
  aside?: boolean;
}[] = [
  { id: "novo", label: "Novo", dot: "var(--wip)" },
  { id: "contatado", label: "Contatado", dot: "var(--data)" },
  { id: "qualificado", label: "Qualificado", dot: "var(--done)" },
  { id: "virou_proposta", label: "Virou proposta", dot: "var(--action)" },
  { id: "proposta_aprovada", label: "Proposta aprovada", dot: "#22c55e" },
  { id: "descartado", label: "Descartado", dot: "var(--ink-muted)", aside: true },
];

const PROPOSTA_BASE = "https://emerge-propostas.vercel.app";

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
  proposta_slug: "",
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
    proposta_slug: l.proposta_slug ?? "",
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
            toast.error(actionError(err, "Falhou ao salvar"));
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
              step="any"
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
        {(form.status === "virou_proposta" ||
          form.status === "proposta_aprovada") && (
          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Slug da proposta
            </span>
            <input
              value={form.proposta_slug ?? ""}
              onChange={(e) => set("proposta_slug", e.target.value)}
              placeholder="ex: varanda-estaiada-2026"
              className={`mt-1 ${inputCls}`}
            />
          </label>
        )}
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
                    actionError(err, "Falhou ao excluir"),
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
  onMove,
  onLinkProposta,
}: {
  lead: LeadRow;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (status: LeadStatus) => void;
  onLinkProposta: () => void;
}) {
  return (
    <div
      className="border-line bg-surface rounded-xl border p-3"
      draggable={canManage}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/lead-id", String(lead.id));
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1.5">
          {canManage && (
            <GripVertical className="text-ink-muted mt-0.5 size-3.5 shrink-0 cursor-grab" />
          )}
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
        </div>
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

      {lead.status === "virou_proposta" &&
        (lead.proposta_slug ? (
          <a
            href={`${PROPOSTA_BASE}/${lead.proposta_slug}`}
            target="_blank"
            rel="noreferrer"
            className="border-line hover:border-data/40 text-ink-muted hover:text-ink mt-2 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]"
          >
            <ExternalLink className="size-3" />
            {lead.proposta_slug}
          </a>
        ) : canManage ? (
          <button
            type="button"
            onClick={onLinkProposta}
            className="text-data-text mt-2 text-[11px] hover:underline"
          >
            + vincular proposta
          </button>
        ) : null)}

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
          onChange={(e) => onMove(e.target.value as LeadStatus)}
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
  leads: leadsProp,
  canManage,
  loadError,
  canvas,
}: {
  leads: LeadRow[];
  canManage: boolean;
  loadError: string | null;
  canvas: CanvasSnapshot;
}) {
  const [editing, setEditing] = useState<LeadInput | null>(null);
  const [deleting, setDeleting] = useState<LeadRow | null>(null);
  const [closingDeal, setClosingDeal] = useState<LeadRow | null>(null);
  const [view, setView] = useState<"board" | "canvas">("board");
  const [leads, setLeads] = useState<LeadRow[]>(leadsProp);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [, start] = useTransition();

  useEffect(() => setLeads(leadsProp), [leadsProp]);

  const byColumn = useMemo(() => {
    const map = new Map<string, LeadRow[]>();
    for (const c of COLUMNS) map.set(c.id, []);
    for (const l of leads) {
      (map.get(l.status) ?? map.get("novo"))!.push(l);
    }
    return map;
  }, [leads]);

  const totalValor = leads.reduce((s, l) => s + (l.valor_estimado || 0), 0);

  const doMove = (lead: LeadRow, status: LeadStatus) => {
    if (lead.status === status) return;
    if (status === "proposta_aprovada") {
      setClosingDeal(lead);
      return;
    }
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status } : l)),
    );
    start(async () => {
      try {
        await moveLeadStage(lead.id, status);
      } catch (err) {
        setLeads(leadsProp);
        toast.error(actionError(err, "Falhou ao mover"));
      }
    });
  };

  const onDropCol = (colId: LeadStatus, e: DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const id = Number(e.dataTransfer.getData("text/lead-id"));
    const lead = leads.find((l) => l.id === id);
    if (lead) doMove(lead, colId);
  };

  const renderColumn = (col: (typeof COLUMNS)[number]) => {
    const items = byColumn.get(col.id) ?? [];
    return (
      <section key={col.id} className="flex w-[280px] shrink-0 flex-col">
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
        <div
          onDragOver={(e) => {
            if (!canManage) return;
            e.preventDefault();
            setDragOver(col.id);
          }}
          onDragLeave={() => setDragOver((d) => (d === col.id ? null : d))}
          onDrop={(e) => onDropCol(col.id, e)}
          className={`flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl p-2 transition-colors ${
            dragOver === col.id
              ? "bg-data/10 ring-data/40 ring-1"
              : "bg-surface-2/40"
          }`}
        >
          {items.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              canManage={canManage}
              onEdit={() => setEditing(toInput(lead))}
              onDelete={() => setDeleting(lead)}
              onMove={(status) => doMove(lead, status)}
              onLinkProposta={() => setEditing(toInput(lead))}
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
  };

  return (
    <>
      <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
        <span className="text-ink-muted text-xs">
          {leads.length} leads · {formatCurrency(totalValor)} estimado ·{" "}
          <span>gerados pelo Radar + manuais</span>
        </span>
        <div className="flex items-center gap-2">
          {!loadError && (
            <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
              <TabsList>
                <TabsTrigger value="board">
                  <KanbanSquare className="size-4" />
                  Board
                </TabsTrigger>
                <TabsTrigger value="canvas">
                  <Workflow className="size-4" />
                  Canvas
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          {canManage && (
            <Button size="sm" onClick={() => setEditing(BLANK)}>
              <Plus className="size-4" />
              Novo lead
            </Button>
          )}
        </div>
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
      ) : view === "canvas" ? (
        <div className="border-line min-h-0 flex-1 border-t">
          <PipelineCanvas
            leads={leads}
            snapshot={canvas}
            canManage={canManage}
            onOpenLead={(id) => {
              const l = leads.find((x) => x.id === id);
              if (l) setEditing(toInput(l));
            }}
          />
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto p-4 md:p-6">
          {COLUMNS.filter((c) => !c.aside).map(renderColumn)}
          <div className="border-line mx-1 w-px shrink-0 self-stretch" />
          {COLUMNS.filter((c) => c.aside).map(renderColumn)}
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

      {closingDeal && (
        <CloseDealDialog
          lead={closingDeal}
          onClose={() => setClosingDeal(null)}
          onDone={() =>
            setLeads((prev) =>
              prev.map((l) =>
                l.id === closingDeal.id
                  ? { ...l, status: "proposta_aprovada" }
                  : l,
              ),
            )
          }
        />
      )}
    </>
  );
}

function CloseDealDialog({
  lead,
  onClose,
  onDone,
}: {
  lead: LeadRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
      <div className="border-line bg-surface w-full max-w-sm rounded-xl border p-5">
        <h3 className="text-sm font-semibold">
          Fechar negócio: criar cliente {lead.empresa}?
        </h3>
        <p className="text-ink-muted mt-1 text-sm">
          Move o lead pra “Proposta aprovada” e cria um cliente com o nome,
          segmento e contato do lead. Contrato e cobrança ficam pra depois.
        </p>
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
                  const r = await closeDealCreateClient(lead.id);
                  onDone();
                  toast.success(
                    r?.clientCreated
                      ? "Negócio fechado · cliente criado"
                      : "Negócio fechado · cliente já existia",
                  );
                  onClose();
                } catch (err) {
                  toast.error(actionError(err, "Falhou ao fechar negócio"));
                }
              })
            }
          >
            {pending ? "Fechando…" : "Fechar negócio"}
          </Button>
        </div>
      </div>
    </div>
  );
}
