"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import type { AppPermission, AppRoleWithPerms } from "@/lib/auth/roles";
import {
  createRole,
  deleteRole,
  setRolePermission,
} from "@/app/(app)/equipe/actions";
import { cn } from "@/lib/utils";

const COLORS = ["#45f0d1", "#c9ff3f", "#93a6ff", "#fbbf24", "#ff8f6b", "#c98bff"];

export function RolesEditor({
  roles,
  permissions,
}: {
  roles: AppRoleWithPerms[];
  permissions: AppPermission[];
}) {
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState(roles[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[1]);

  const selected = roles.find((r) => r.id === selectedId) ?? roles[0] ?? null;

  const groups = useMemo(() => {
    const g: Record<string, AppPermission[]> = {};
    for (const p of permissions) (g[p.area] ??= []).push(p);
    return Object.entries(g);
  }, [permissions]);

  function act(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou");
      }
    });
  }

  return (
    <div className="grid gap-5 p-4 md:grid-cols-[240px_1fr] md:p-6">
      {/* ---- lista de papéis ---- */}
      <div className="flex flex-col gap-1.5">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => {
              setSelectedId(r.id);
              setCreating(false);
            }}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              selected?.id === r.id && !creating
                ? "border-border bg-card"
                : "border-transparent hover:bg-card/50",
            )}
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: r.color ?? "#8b918f" }}
            />
            <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
            <span className="text-muted-foreground text-[11px]">
              {r.permissions.length}
            </span>
          </button>
        ))}

        {creating ? (
          <div className="border-border mt-1 flex flex-col gap-2 rounded-lg border p-2.5">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do papel"
              className="border-input bg-background h-8 rounded-md border px-2 text-sm outline-none"
            />
            <div className="flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={cn(
                    "size-5 rounded-full",
                    newColor === c && "ring-2 ring-offset-2 ring-offset-[#0a0b0c]",
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={pending || !newName.trim()}
                onClick={() =>
                  act(async () => {
                    await createRole({ name: newName, slug: newName, color: newColor });
                    setCreating(false);
                    setNewName("");
                  })
                }
                className="rounded-md bg-[#c9ff3f] px-2.5 py-1 text-xs font-semibold text-[#0a0b0c]"
              >
                Criar
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="text-muted-foreground px-2 py-1 text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="text-muted-foreground hover:text-foreground mt-1 rounded-lg border border-dashed border-border px-3 py-2 text-left text-sm"
          >
            + Novo papel
          </button>
        )}
      </div>

      {/* ---- permissões do papel selecionado ---- */}
      {selected && (
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{selected.name}</h3>
            {selected.is_system ? (
              <span className="rounded-full bg-[#45f0d1]/15 px-2 py-0.5 text-[11px] font-medium text-[#45f0d1]">
                sistema · acesso total
              </span>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  act(async () => {
                    if (confirm(`Apagar o papel "${selected.name}"?`))
                      await deleteRole(selected.id);
                  })
                }
                className="text-muted-foreground hover:text-[#ff5d5d] ml-auto text-xs"
              >
                Apagar papel
              </button>
            )}
          </div>

          {selected.description && (
            <p className="text-muted-foreground mb-4 text-sm">
              {selected.description}
            </p>
          )}

          {selected.is_system ? (
            <p className="text-muted-foreground text-sm">
              O papel de administrador sempre tem todas as permissões e não pode ser
              editado.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {groups.map(([area, perms]) => (
                <div key={area}>
                  <div className="text-muted-foreground mb-1.5 text-[11px] font-semibold uppercase tracking-wide">
                    {area}
                  </div>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {perms.map((p) => {
                      const on = selected.permissions.includes(p.key);
                      return (
                        <label
                          key={p.key}
                          className={cn(
                            "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                            on
                              ? "border-[#45f0d1]/40 bg-[#45f0d1]/5"
                              : "border-border hover:bg-card/50",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            disabled={pending}
                            onChange={(e) =>
                              act(() =>
                                setRolePermission(
                                  selected.id,
                                  p.key,
                                  e.target.checked,
                                ),
                              )
                            }
                            className="accent-[#45f0d1]"
                          />
                          <span className="flex-1">{p.label}</span>
                          <code className="text-muted-foreground text-[10px]">
                            {p.key}
                          </code>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
