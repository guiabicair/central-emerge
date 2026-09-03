"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteCourse,
  saveCourse,
  type CourseInput,
} from "@/app/(app)/equipe/actions";
import { SecretField } from "@/components/equipe/secret-field";

export interface CourseItem {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  email: string | null;
  password: string | null;
}

const blank: CourseInput = {
  title: "",
  description: "",
  link: "",
  email: "",
  password: "",
};

const field =
  "border-input bg-background h-9 rounded-md border px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

function Form({
  initial,
  onDone,
  onCancel,
}: {
  initial: CourseInput;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CourseInput>(initial);
  const [pending, start] = useTransition();
  const set = <K extends keyof CourseInput>(k: K, v: CourseInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="border-border bg-card grid gap-2.5 rounded-xl border p-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs font-medium sm:col-span-2">
        Título
        <input
          className={field}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium sm:col-span-2">
        Descrição
        <input
          className={field}
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium sm:col-span-2">
        Link de acesso
        <input
          className={field}
          value={form.link ?? ""}
          onChange={(e) => set("link", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        E-mail de acesso
        <input
          className={field}
          value={form.email ?? ""}
          onChange={(e) => set("email", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        Senha
        <input
          className={field}
          value={form.password ?? ""}
          onChange={(e) => set("password", e.target.value)}
        />
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="button"
          disabled={pending || !form.title.trim()}
          onClick={() =>
            start(async () => {
              try {
                await saveCourse(form);
                onDone();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Falhou");
              }
            })
          }
          className="rounded-md bg-[#c9ff3f] px-3 py-1.5 text-xs font-semibold text-[#0a0b0c]"
        >
          {form.id ? "Salvar" : "Adicionar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground px-2 py-1.5 text-xs"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function CoursesList({
  items,
  canManage,
}: {
  items: CourseItem[];
  canManage: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<CourseItem | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-3 p-4 md:p-6">
      {canManage && !adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="border-border text-muted-foreground hover:text-foreground self-start rounded-lg border border-dashed px-3 py-2 text-sm"
        >
          <Plus className="mr-1 inline size-4" /> Novo curso
        </button>
      )}
      {adding && (
        <Form
          initial={blank}
          onDone={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((c) =>
          editing === c.id ? (
            <div key={c.id} className="sm:col-span-2 xl:col-span-3">
              <Form
                initial={{
                  id: c.id,
                  title: c.title,
                  description: c.description ?? "",
                  link: c.link ?? "",
                  email: c.email ?? "",
                  password: c.password ?? "",
                }}
                onDone={() => setEditing(null)}
                onCancel={() => setEditing(null)}
              />
            </div>
          ) : (
            <div
              key={c.id}
              className="border-border bg-card flex flex-col gap-2 rounded-xl border p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 font-medium">{c.title}</div>
                {canManage && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(c.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setConfirmDel(c)}
                      className="text-muted-foreground hover:text-[#ff5d5d]"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {c.description && (
                <p className="text-muted-foreground text-xs">{c.description}</p>
              )}

              <div className="mt-auto flex flex-col gap-1 text-xs">
                {c.email && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">e-mail</span>
                    <code className="bg-muted rounded px-1.5 py-0.5 font-mono">
                      {c.email}
                    </code>
                  </div>
                )}
                {c.password && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">senha</span>
                    <SecretField value={c.password} />
                  </div>
                )}
              </div>

              {c.link && (
                <a
                  href={c.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand mt-1 inline-flex items-center gap-1 text-xs font-medium"
                >
                  Acessar curso <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          ),
        )}
      </div>

      {!items.length && !adding && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Nenhum curso cadastrado.
        </p>
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
          <div className="border-border bg-card w-full max-w-sm rounded-xl border p-5">
            <h3 className="text-sm font-semibold">
              Excluir “{confirmDel.title}”?
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Não dá pra desfazer.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDel(null)}
                className="text-muted-foreground px-3 py-1.5 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    try {
                      await deleteCourse(confirmDel.id);
                      setConfirmDel(null);
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Falhou");
                    }
                  })
                }
                className="rounded-md bg-[#ff5d5d] px-3 py-1.5 text-xs font-semibold text-white"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
