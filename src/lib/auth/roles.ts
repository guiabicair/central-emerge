import "server-only";

import { cache } from "react";

import { createUntypedClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/auth";

/* ------------------------------------------------------------------ *
 * Tipos das tabelas app_* (migration 0001). Escritos à mão até o
 * generate-types rodar depois que a migration for aplicada.
 * ------------------------------------------------------------------ */

export interface AppPermission {
  key: string;
  label: string;
  area: string;
  description: string | null;
  position: number;
}

export interface AppRole {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string | null;
  is_system: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface AppRoleWithPerms extends AppRole {
  permissions: string[];
}

export interface TeamMember {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  approval_status: "pending" | "approved" | "rejected" | null;
  requested_role: string | null;
  mood: string | null;
  created_at: string;
  roles: string[];
}

/* ------------------------------------------------------------------ *
 * Acesso do usuário logado
 * ------------------------------------------------------------------ */

interface SessionAccess {
  isAdmin: boolean;
  permissions: Set<string>;
  roles: string[];
}

export const getSessionAccess = cache(async (): Promise<SessionAccess> => {
  const empty: SessionAccess = { isAdmin: false, permissions: new Set(), roles: [] };

  const user = await getUser();
  if (!user) return empty;

  const supabase = await createUntypedClient();
  const { data, error } = await supabase
    .from("app_user_roles")
    .select("app_roles(slug, app_role_permissions(permission_key))")
    .eq("user_id", user.id);

  if (error || !data) return empty;

  const roles = new Set<string>();
  const permissions = new Set<string>();

  for (const row of data as unknown as Array<{
    app_roles: {
      slug: string;
      app_role_permissions: { permission_key: string }[];
    } | null;
  }>) {
    const r = row.app_roles;
    if (!r) continue;
    roles.add(r.slug);
    for (const p of r.app_role_permissions ?? []) permissions.add(p.permission_key);
  }

  return { isAdmin: roles.has("admin"), permissions, roles: [...roles] };
});

/** true se o usuário tem a permissão (admin tem todas). */
export async function can(permission: string): Promise<boolean> {
  const { isAdmin, permissions } = await getSessionAccess();
  return isAdmin || permissions.has(permission);
}

/** Redireciona se não tiver a permissão. Use no topo de páginas server. */
export async function requirePermission(permission: string): Promise<void> {
  if (!(await can(permission))) {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard?erro=sem-acesso");
  }
}

/* ------------------------------------------------------------------ *
 * Leitura de papéis / catálogo / equipe
 * ------------------------------------------------------------------ */

export async function listPermissions(): Promise<AppPermission[]> {
  const supabase = await createUntypedClient();
  const { data } = await supabase.from("app_permissions").select("*").order("position");
  return (data as AppPermission[]) ?? [];
}

export async function listRoles(): Promise<AppRoleWithPerms[]> {
  const supabase = await createUntypedClient();
  const { data } = await supabase
    .from("app_roles")
    .select("*, app_role_permissions(permission_key)")
    .order("position");

  return (
    (data as unknown as Array<
      AppRole & { app_role_permissions: { permission_key: string }[] }
    >) ?? []
  ).map((r) => ({
    ...r,
    permissions: (r.app_role_permissions ?? []).map((p) => p.permission_key),
  }));
}

export async function listTeam(): Promise<TeamMember[]> {
  const supabase = await createUntypedClient();
  const { data } = await supabase.rpc("app_team_members");
  const order: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
  return ((data as TeamMember[]) ?? []).slice().sort(
    (a, b) =>
      (order[a.approval_status ?? "approved"] ?? 1) -
        (order[b.approval_status ?? "approved"] ?? 1) ||
      (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email),
  );
}
