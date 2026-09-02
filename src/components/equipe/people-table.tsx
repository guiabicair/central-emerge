"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { AppRoleWithPerms, TeamMember } from "@/lib/auth/roles";
import { setApprovalStatus, setUserRoles } from "@/app/(app)/equipe/actions";
import { cn } from "@/lib/utils";

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendente", cls: "bg-[#fbbf24]/15 text-[#fbbf24]" },
  approved: { label: "Aprovado", cls: "bg-[#34d399]/15 text-[#34d399]" },
  rejected: { label: "Rejeitado", cls: "bg-[#ff5d5d]/15 text-[#ff5d5d]" },
};

export function PeopleTable({
  members,
  roles,
  canApprove,
  canManageRoles,
}: {
  members: TeamMember[];
  roles: AppRoleWithPerms[];
  canApprove: boolean;
  canManageRoles: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [busyRow, setBusyRow] = useState<string | null>(null);

  function run(userId: string, fn: () => Promise<void>) {
    setBusyRow(userId);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou");
      } finally {
        setBusyRow(null);
      }
    });
  }

  function toggleRole(m: TeamMember, roleId: string, slug: string) {
    const active = m.roles.includes(slug);
    const next = roles
      .filter((r) => (r.id === roleId ? !active : m.roles.includes(r.slug)))
      .map((r) => r.id);
    run(m.user_id, () => setUserRoles(m.user_id, next));
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase tracking-wide">
            <th className="px-4 py-2.5 font-medium md:px-6">Pessoa</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Papéis</th>
            <th className="px-4 py-2.5 font-medium md:px-6">Ações</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const nome = m.full_name?.trim() || m.email.split("@")[0];
            const status = STATUS_META[m.approval_status ?? "approved"];
            const rowBusy = pending && busyRow === m.user_id;
            return (
              <tr
                key={m.user_id}
                className={cn(
                  "border-border/60 border-b align-top transition-opacity",
                  rowBusy && "opacity-50",
                )}
              >
                <td className="px-4 py-3 md:px-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#45f0d1]/15 text-xs font-semibold text-[#45f0d1]">
                      {initials(nome)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{nome}</div>
                      <div className="text-muted-foreground truncate text-xs">
                        {m.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      status.cls,
                    )}
                  >
                    {status.label}
                  </span>
                  {m.requested_role && m.approval_status === "pending" && (
                    <div className="text-muted-foreground mt-1 text-[11px]">
                      pediu: {m.requested_role}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {roles.map((r) => {
                      const on = m.roles.includes(r.slug);
                      if (!canManageRoles && !on) return null;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          disabled={!canManageRoles || rowBusy}
                          onClick={() => toggleRole(m, r.id, r.slug)}
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-xs transition-colors",
                            on
                              ? "border-transparent text-[#04231d]"
                              : "border-border text-muted-foreground hover:text-foreground",
                            canManageRoles && "cursor-pointer",
                          )}
                          style={on ? { background: r.color ?? "#45f0d1" } : undefined}
                        >
                          {r.name}
                        </button>
                      );
                    })}
                    {!m.roles.length && !canManageRoles && (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 md:px-6">
                  {canApprove && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.approval_status !== "approved" && (
                        <button
                          type="button"
                          disabled={rowBusy}
                          onClick={() =>
                            run(m.user_id, () =>
                              setApprovalStatus(m.user_id, "approved"),
                            )
                          }
                          className="rounded-md bg-[#c9ff3f] px-2.5 py-1 text-xs font-semibold text-[#0a0b0c] hover:bg-[#c9ff3f]/90"
                        >
                          Aprovar
                        </button>
                      )}
                      {m.approval_status !== "rejected" && (
                        <button
                          type="button"
                          disabled={rowBusy}
                          onClick={() =>
                            run(m.user_id, () =>
                              setApprovalStatus(m.user_id, "rejected"),
                            )
                          }
                          className="border-border text-muted-foreground hover:text-foreground rounded-md border px-2.5 py-1 text-xs"
                        >
                          Rejeitar
                        </button>
                      )}
                      {m.approval_status === "approved" && (
                        <button
                          type="button"
                          disabled={rowBusy}
                          onClick={() =>
                            run(m.user_id, () =>
                              setApprovalStatus(m.user_id, "pending"),
                            )
                          }
                          className="border-border text-muted-foreground hover:text-foreground rounded-md border px-2.5 py-1 text-xs"
                        >
                          Suspender
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {!members.length && (
            <tr>
              <td colSpan={4} className="text-muted-foreground px-6 py-10 text-center">
                Nenhum membro ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
