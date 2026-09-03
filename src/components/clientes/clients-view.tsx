"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { saveClient, deleteClient, type ClientInput } from "@/app/(app)/clientes/actions";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { actionError, formatCurrency } from "@/lib/utils";

export interface ClientRow {
  id: string;
  name: string;
  segment: string | null;
  mrr: number;
  status: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_seed: boolean;
  activeProjects: number;
}

const BLANK: ClientInput = {
  name: "",
  segment: "",
  mrr: 0,
  status: "active",
  contact_name: "",
  email: "",
  phone: "",
  notes: "",
};

function toInput(c: ClientRow): ClientInput {
  return {
    id: c.id,
    name: c.name,
    segment: c.segment ?? "",
    mrr: c.mrr,
    status: c.status === "inactive" ? "inactive" : "active",
    contact_name: c.contact_name ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    notes: c.notes ?? "",
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-ink-muted text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  "border-line-strong h-9 w-full rounded-md border bg-transparent px-2.5 text-sm outline-none focus:border-data";

function ClientForm({
  initial,
  onClose,
}: {
  initial: ClientInput;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ClientInput>(initial);
  const [pending, start] = useTransition();
  const set = <K extends keyof ClientInput>(k: K, v: ClientInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name.trim()) {
          toast.error("Nome é obrigatório.");
          return;
        }
        start(async () => {
          try {
            await saveClient(form);
            toast.success(initial.id ? "Cliente atualizado" : "Cliente criado");
            onClose();
          } catch (err) {
            toast.error(actionError(err, "Falhou ao salvar"));
          }
        });
      }}
    >
      <SheetHeader className="border-line border-b p-5 pr-12">
        <SheetTitle className="text-base font-semibold">
          {initial.id ? "Editar cliente" : "Novo cliente"}
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <Field label="Nome *">
          <input
            autoFocus
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo / segmento">
            <input
              value={form.segment}
              onChange={(e) => set("segment", e.target.value)}
              placeholder="casa de eventos…"
              className={inputCls}
            />
          </Field>
          <Field label="MRR mensal (R$)">
            <input
              type="number"
              min={0}
              step="any"
              value={form.mrr ?? 0}
              onChange={(e) => set("mrr", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) =>
              set("status", e.target.value as "active" | "inactive")
            }
            className={inputCls}
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contato (pessoa)">
            <input
              value={form.contact_name}
              onChange={(e) => set("contact_name", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Telefone">
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="E-mail">
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Observações">
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={4}
            className="border-line-strong focus:border-data w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none"
          />
        </Field>
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
  client,
  onClose,
}: {
  client: ClientRow;
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="border-line bg-surface w-full max-w-sm rounded-xl border p-5">
        <h3 className="text-sm font-semibold">Excluir {client.name}?</h3>
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
                  await deleteClient(client.id);
                  toast.success("Cliente excluído");
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

export function ClientsView({
  clients,
  canManage,
  showTest,
  loadError,
}: {
  clients: ClientRow[];
  canManage: boolean;
  showTest: boolean;
  loadError: string | null;
}) {
  const [editing, setEditing] = useState<ClientInput | null>(null);
  const [deleting, setDeleting] = useState<ClientRow | null>(null);

  if (loadError) {
    return (
      <div className="border-line bg-surface rounded-2xl border p-6 text-sm">
        <p className="font-medium">Não foi possível carregar os clientes.</p>
        <p className="text-ink-muted mt-1">
          Rode a migration <code>0003</code> (adiciona os campos de cliente e o
          bridge de RLS) e o seed. Detalhe: {loadError}
        </p>
      </div>
    );
  }

  const total = clients.reduce((s, c) => s + c.mrr, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-ink-muted text-xs">
          {clients.length} {clients.length === 1 ? "cliente" : "clientes"} ·{" "}
          {formatCurrency(total)}/mês
          {" · "}
          <Link
            href={showTest ? "/clientes" : "/clientes?teste=1"}
            scroll={false}
            className="hover:text-ink underline"
          >
            {showTest ? "ocultar dados de teste" : "mostrar dados de teste"}
          </Link>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setEditing(BLANK)}>
            <Plus className="size-4" />
            Adicionar cliente
          </Button>
        )}
      </div>

      {clients.length === 0 ? (
        <div className="border-line bg-surface rounded-2xl border p-8 text-center">
          <p className="text-sm font-medium">Nenhum cliente ainda.</p>
          {canManage && (
            <Button
              size="sm"
              className="mt-3"
              onClick={() => setEditing(BLANK)}
            >
              <Plus className="size-4" />
              Adicionar cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="border-line bg-surface rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="pl-4">Cliente</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Projetos ativos</TableHead>
                {canManage && <TableHead className="pr-4" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow
                  key={c.id}
                  className="border-line"
                  onClick={
                    canManage ? () => setEditing(toInput(c)) : undefined
                  }
                  data-clickable={canManage || undefined}
                >
                  <TableCell className="pl-4">
                    <div className="font-medium">{c.name}</div>
                    {(c.contact_name || c.email) && (
                      <div className="text-ink-muted text-xs">
                        {c.contact_name}
                        {c.contact_name && c.email ? " · " : ""}
                        {c.email}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-ink-muted">
                    {c.segment ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(c.mrr)}
                  </TableCell>
                  <TableCell>
                    <StatusPill color={c.status === "inactive" ? "slate" : "green"}>
                      {c.status === "inactive" ? "Inativo" : "Ativo"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    {c.activeProjects}
                  </TableCell>
                  {canManage && (
                    <TableCell className="pr-4">
                      <div
                        className="flex justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditing(toInput(c))}
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleting(c)}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <SheetContent side="right" className="w-full p-0 sm:max-w-[440px]">
          {editing && (
            <ClientForm initial={editing} onClose={() => setEditing(null)} />
          )}
        </SheetContent>
      </Sheet>

      {deleting && (
        <DeleteDialog
          client={deleting}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
