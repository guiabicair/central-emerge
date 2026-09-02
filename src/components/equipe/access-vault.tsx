"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deletePlatformAccess,
  savePlatformAccess,
  type PlatformAccessInput,
} from "@/app/(app)/equipe/actions";
import { SecretField } from "@/components/equipe/secret-field";
import { cn } from "@/lib/utils";

export interface AccessItem {
  id: string;
  platform_name: string;
  category: string;
  login_url: string | null;
  username: string | null;
  password: string | null;
  description: string | null;
  additional_info: string | null;
  is_active: boolean;
}

const CATEGORIES: Record<string, string> = {
  design: "Design",
  development: "Desenvolvimento",
  marketing: "Marketing",
  social_media: "Redes Sociais",
  communication: "Comunicação",
  storage: "Armazenamento",
  productivity: "Produtividade",
  other: "Outros",
};

const blank: PlatformAccessInput = {
  platform_name: "",
  category: "other",
  login_url: "",
  username: "",
  password: "",
  description: "",
  additional_info: "",
  is_active: true,
};

function Form({
  initial,
  onDone,
  onCancel,
}: {
  initial: PlatformAccessInput;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<PlatformAccessInput>(initial);
  const [pending, start] = useTransition();

  function set<K extends keyof PlatformAccessInput>(k: K, v: PlatformAccessInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const field =
    "border-input bg-background h-9 rounded-md border px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="border-border bg-card grid gap-2.5 rounded-xl border p-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs font-medium">
        Plataforma
        <input
          className={field}
          value={form.platform_name}
          onChange={(e) => set("platform_name", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        Categoria
        <select
          className={field}
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
        >
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        URL de login
        <input
          className={field}
          value={form.login_url ?? ""}
          onChange={(e) => set("login_url", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        Usuário / e-mail
        <input
          className={field}
          value={form.username ?? ""}
          onChange={(e) => set("username", e.target.value)}
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
      <label className="flex items-center gap-2 self-end pb-1.5 text-xs font-medium">
        <input
          type="checkbox"
          checked={form.is_active ?? true}
          onChange={(e) => set("is_active", e.target.checked)}
          className="accent-[#45f0d1]"
        />
        Ativo
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium sm:col-span-2">
        Descrição / uso
        <input
          className={field}
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="button"
          disabled={pending || !form.platform_name.trim()}
          onClick={() =>
            start(async () => {
              try {
                await savePlatformAccess(form);
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

export function AccessVault({
  items,
  canManage,
}: {
  items: AccessItem[];
  canManage: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-3 p-4 md:p-6">
      {canManage && !adding && (
        <button
          type="button"
          onClick={() => {
            setAdding(true);
            setEditing(null);
          }}
          className="border-border text-muted-foreground hover:text-foreground self-start rounded-lg border border-dashed px-3 py-2 text-sm"
        >
          <Plus className="mr-1 inline size-4" /> Novo acesso
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
        {items.map((it) =>
          editing === it.id ? (
            <div key={it.id} className="sm:col-span-2 xl:col-span-3">
              <Form
                initial={{
                  id: it.id,
                  platform_name: it.platform_name,
                  category: it.category,
                  is_active: it.is_active,
                  login_url: it.login_url ?? "",
                  username: it.username ?? "",
                  password: it.password ?? "",
                  description: it.description ?? "",
                  additional_info: it.additional_info ?? "",
                }}
                onDone={() => setEditing(null)}
                onCancel={() => setEditing(null)}
              />
            </div>
          ) : (
            <div
              key={it.id}
              className={cn(
                "border-border bg-card flex flex-col gap-2 rounded-xl border p-4",
                !it.is_active && "opacity-55",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{it.platform_name}</div>
                  <span className="text-muted-foreground text-[11px]">
                    {CATEGORIES[it.category] ?? it.category}
                  </span>
                </div>
                {canManage && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(it.id);
                        setAdding(false);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          if (!confirm(`Excluir "${it.platform_name}"?`)) return;
                          try {
                            await deletePlatformAccess(it.id);
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Falhou");
                          }
                        })
                      }
                      className="text-muted-foreground hover:text-[#ff5d5d]"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {it.description && (
                <p className="text-muted-foreground text-xs">{it.description}</p>
              )}

              <div className="mt-auto flex flex-col gap-1 text-xs">
                {it.username && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">user</span>
                    <code className="bg-muted rounded px-1.5 py-0.5 font-mono">
                      {it.username}
                    </code>
                  </div>
                )}
                {it.password && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">senha</span>
                    <SecretField value={it.password} />
                  </div>
                )}
              </div>

              {it.login_url && (
                <a
                  href={it.login_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand mt-1 inline-flex items-center gap-1 text-xs font-medium"
                >
                  Acessar <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          ),
        )}
      </div>

      {!items.length && !adding && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Nenhum acesso cadastrado.
        </p>
      )}
    </div>
  );
}
