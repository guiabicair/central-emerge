"use client";

import { useState, useTransition } from "react";
import { Check, Mail, Pencil, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import {
  approveOutreachMessage,
  rejectOutreachMessage,
  reopenOutreachMessage,
  updateOutreachDraft,
} from "@/app/(app)/pipeline/outreach-actions";
import { Button } from "@/components/ui/button";
import { StatusPill, type PillColor } from "@/components/status-pill";
import { actionError } from "@/lib/utils";

export interface OutreachRow {
  id: string;
  leadId: number;
  unidade: string;
  empresa: string;
  toEmail: string;
  subject: string;
  body: string;
  status: "draft" | "approved" | "rejected" | "sent" | "failed";
  error: string | null;
  createdAt: string;
  sentAt: string | null;
}

const STATUS_META: Record<OutreachRow["status"], { label: string; color: PillColor }> = {
  draft: { label: "Rascunho — aguardando revisão", color: "amber" },
  approved: { label: "Aprovado — na fila de envio", color: "blue" },
  rejected: { label: "Rejeitado", color: "slate" },
  sent: { label: "Enviado", color: "green" },
  failed: { label: "Falhou ao enviar", color: "rose" },
};

function Card({ row }: { row: OutreachRow }) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(row.subject);
  const [body, setBody] = useState(row.body);
  const [confirmingReject, setConfirmingReject] = useState(false);
  const [pending, start] = useTransition();
  const meta = STATUS_META[row.status];

  function openEdit() {
    setSubject(row.subject);
    setBody(row.body);
    setEditing(true);
  }

  function run(fn: () => Promise<unknown>) {
    start(async () => {
      try {
        await fn();
      } catch (e) {
        toast.error(actionError(e, "Falhou"));
      }
    });
  }

  return (
    <div className="border-line bg-surface rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{row.empresa}</div>
          <div className="text-ink-muted truncate text-xs">{row.toEmail}</div>
        </div>
        <StatusPill color={meta.color}>{meta.label}</StatusPill>
      </div>

      {row.error && (
        <p className="bg-gap/10 text-gap mt-2 rounded-md p-2 text-[11px]">
          {row.error}
        </p>
      )}

      {editing ? (
        <div className="mt-3 space-y-2">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border-line-strong focus:border-data h-9 w-full rounded-md border bg-transparent px-2.5 text-sm outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="border-line-strong focus:border-data w-full resize-none rounded-md border bg-transparent p-2.5 text-sm outline-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSubject(row.subject);
                setBody(row.body);
                setEditing(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await updateOutreachDraft(row.id, { subject, body });
                  setEditing(false);
                })
              }
            >
              Salvar rascunho
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-1.5">
          <div className="text-sm font-medium">{row.subject}</div>
          <p className="text-ink-muted line-clamp-4 text-xs whitespace-pre-wrap">
            {row.body}
          </p>
        </div>
      )}

      {!editing && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {row.status === "draft" && (
            <>
              <Button variant="outline" size="xs" onClick={openEdit}>
                <Pencil className="size-3" />
                Editar
              </Button>
              <Button
                size="xs"
                disabled={pending}
                onClick={() => run(() => approveOutreachMessage(row.id))}
              >
                <Check className="size-3" />
                Aprovar e enviar
              </Button>
              <Button
                variant="ghost"
                size="xs"
                disabled={pending}
                onClick={() => setConfirmingReject(true)}
              >
                <X className="size-3" />
                Rejeitar
              </Button>
            </>
          )}
          {row.status === "approved" && (
            <span className="text-ink-muted text-[11px]">
              Aguardando a rotina automática enviar (roda a cada 2h).
            </span>
          )}
          {(row.status === "rejected" || row.status === "failed") && (
            <Button
              variant="outline"
              size="xs"
              disabled={pending}
              onClick={() => run(() => reopenOutreachMessage(row.id))}
            >
              <RotateCcw className="size-3" />
              Reabrir como rascunho
            </Button>
          )}
          {row.status === "sent" && row.sentAt && (
            <span className="text-ink-muted text-[11px]">
              Enviado em {new Date(row.sentAt).toLocaleString("pt-BR")}
            </span>
          )}
        </div>
      )}

      {confirmingReject && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
          <div className="border-line bg-surface w-full max-w-sm rounded-xl border p-5">
            <h3 className="text-sm font-semibold">Rejeitar rascunho de {row.empresa}?</h3>
            <p className="text-ink-muted mt-1 text-sm">
              Dá pra reabrir como rascunho depois, se mudar de ideia.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmingReject(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    await rejectOutreachMessage(row.id);
                    setConfirmingReject(false);
                  })
                }
              >
                <X className="size-3.5" />
                Rejeitar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function OutreachPanel({ rows }: { rows: OutreachRow[] }) {
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const visible = rows.filter((r) =>
    filter === "pending" ? r.status === "draft" || r.status === "approved" : true,
  );

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="text-ink-muted size-4" />
          <span className="font-medium">Outreach de leads</span>
          <span className="text-ink-muted text-xs">
            — rascunhos gerados pelo agente a partir dos leads do Radar. Você
            revisa, edita se quiser e aprova; o envio (Gmail) acontece na
            próxima rodada automática.
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            size="xs"
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
          >
            Pendentes
          </Button>
          <Button
            size="xs"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Todos
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((row) => (
          <Card key={row.id} row={row} />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-ink-muted py-16 text-center text-sm">
          {filter === "pending"
            ? "Nenhum rascunho pendente — o agente gera novos a partir dos leads sem outreach ainda, a cada rodada."
            : "Nenhuma mensagem de outreach ainda."}
        </p>
      )}
    </div>
  );
}
