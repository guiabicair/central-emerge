"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { can } from "@/lib/auth/roles";
import { createUntypedClient } from "@/lib/supabase/server";

const REV = "/equipe/organizacao";

async function guard() {
  if (!(await can("equipe.manage_roles"))) {
    throw new Error("Sem permissão para gerir a organização.");
  }
}

type DB = Awaited<ReturnType<typeof createUntypedClient>>;

function slugify(raw: string) {
  return raw
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueCompanySlug(db: DB, name: string) {
  const base = slugify(name) || "empresa";
  let slug = base;
  for (let i = 0; i < 6; i++) {
    const { data } = await db
      .from("app_companies")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i + 2}`;
  }
  return `${base}-${randomUUID().slice(0, 6)}`;
}

function uniq(ids: string[]) {
  return [...new Set(ids.filter(Boolean))];
}

/**
 * O trigger `app_companies_no_cycle` (migration 0021) é a fonte da verdade pro
 * guard de ciclo de matriz. Quando ele dispara, o erro vem do banco — devolvemos
 * a mensagem dele (já é amigável) e limpamos ruído de PostgREST se houver.
 */
function friendlyDbError(msg: string): string {
  const m = msg.trim();
  if (/matriz de si mesma/i.test(m)) {
    return "Uma empresa não pode ser matriz de si mesma.";
  }
  if (/ciclo de matriz|possível ciclo/i.test(m)) {
    return "Isso criaria um ciclo de matriz (A → … → A).";
  }
  return m;
}

/* ------------------------------------------------------------------ empresas */

export async function createCompany(input: {
  name: string;
  color?: string | null;
  parent_id?: string | null;
  frente_slug?: string | null;
}) {
  await guard();
  const db = await createUntypedClient();
  const name = input.name.trim().slice(0, 80);
  if (!name) throw new Error("Nome é obrigatório.");
  const slug = await uniqueCompanySlug(db, name);
  const { error } = await db.from("app_companies").insert({
    name,
    slug,
    color: input.color || null,
    parent_id: input.parent_id || null,
    frente_slug: input.frente_slug?.trim() || null,
    position: 100,
  });
  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePath(REV);
}

/** Caminha a cadeia de matrizes a partir de `newParentId`; true se topar com `companyId`. */
async function wouldCreateCycle(db: DB, companyId: string, newParentId: string) {
  let cur: string | null = newParentId;
  const seen = new Set<string>([companyId]);
  while (cur) {
    if (seen.has(cur)) return true;
    seen.add(cur);
    const res = await db
      .from("app_companies")
      .select("parent_id")
      .eq("id", cur)
      .maybeSingle();
    const row = res.data as { parent_id: string | null } | null;
    cur = row?.parent_id ?? null;
  }
  return false;
}

export async function updateCompany(
  id: string,
  patch: {
    name?: string;
    color?: string | null;
    parent_id?: string | null;
    frente_slug?: string | null;
  },
) {
  await guard();
  const db = await createUntypedClient();
  const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (patch.name !== undefined) {
    const n = patch.name.trim().slice(0, 80);
    if (!n) throw new Error("Nome é obrigatório.");
    upd.name = n;
  }
  if (patch.color !== undefined) upd.color = patch.color || null;
  if (patch.frente_slug !== undefined) {
    upd.frente_slug = patch.frente_slug?.trim() || null;
  }
  if (patch.parent_id !== undefined) {
    const p = patch.parent_id || null;
    // pré-checagens no app dão um erro mais rápido/claro; o trigger 0021 é a
    // fonte da verdade e cobre qualquer caminho (SQL direto, importação, etc).
    if (p === id) throw new Error("Uma empresa não pode ser matriz de si mesma.");
    if (p && (await wouldCreateCycle(db, id, p))) {
      throw new Error("Isso criaria um ciclo de matriz (A → … → A).");
    }
    upd.parent_id = p;
  }

  const { error } = await db.from("app_companies").update(upd).eq("id", id);
  if (error) throw new Error(friendlyDbError(error.message));
  revalidatePath(REV);
}

export async function deleteCompany(id: string) {
  await guard();
  const db = await createUntypedClient();
  // FK on delete: times/membros/papéis/cliente-vínculos da empresa somem (cascade);
  // empresas-filhas ficam órfãs (parent_id -> set null); `clients` não é tocado.
  const { error } = await db.from("app_companies").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(REV);
}

/* ------------------------------------------------------------------ times */

export async function createTeam(
  companyId: string,
  input: { name: string; color?: string | null },
) {
  await guard();
  if (!companyId) throw new Error("Empresa é obrigatória.");
  const db = await createUntypedClient();
  const name = input.name.trim().slice(0, 80);
  if (!name) throw new Error("Nome é obrigatório.");
  const { error } = await db.from("app_teams").insert({
    company_id: companyId,
    name,
    color: input.color || null,
    position: 100,
  });
  if (error) throw new Error(error.message);
  revalidatePath(REV);
}

export async function updateTeam(
  id: string,
  patch: { name?: string; color?: string | null },
) {
  await guard();
  const db = await createUntypedClient();
  const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) {
    const n = patch.name.trim().slice(0, 80);
    if (!n) throw new Error("Nome é obrigatório.");
    upd.name = n;
  }
  if (patch.color !== undefined) upd.color = patch.color || null;
  const { error } = await db.from("app_teams").update(upd).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(REV);
}

export async function deleteTeam(id: string) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db.from("app_teams").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(REV);
}

/* ------------------------------------------------------------------ vínculos */

export async function setTeamMembers(
  teamId: string,
  members: { user_id: string; is_lead: boolean }[],
) {
  await guard();
  const db = await createUntypedClient();
  const { error: delErr } = await db
    .from("app_team_members")
    .delete()
    .eq("team_id", teamId);
  if (delErr) throw new Error(delErr.message);

  const seen = new Set<string>();
  const rows = members
    .filter((m) => {
      if (!m.user_id || seen.has(m.user_id)) return false;
      seen.add(m.user_id);
      return true;
    })
    .map((m) => ({ team_id: teamId, user_id: m.user_id, is_lead: !!m.is_lead }));

  if (rows.length) {
    const { error } = await db.from("app_team_members").insert(rows);
    if (error) throw new Error(error.message);
  }
  revalidatePath(REV);
}

export async function setCompanyMembers(companyId: string, userIds: string[]) {
  await guard();
  const db = await createUntypedClient();
  const { error: delErr } = await db
    .from("app_company_members")
    .delete()
    .eq("company_id", companyId);
  if (delErr) throw new Error(delErr.message);

  const ids = uniq(userIds);
  if (ids.length) {
    const { error } = await db
      .from("app_company_members")
      .insert(ids.map((user_id) => ({ company_id: companyId, user_id })));
    if (error) throw new Error(error.message);
  }
  revalidatePath(REV);
}

export async function setTeamRoles(teamId: string, roleIds: string[]) {
  await guard();
  const db = await createUntypedClient();
  const { error: delErr } = await db
    .from("app_team_roles")
    .delete()
    .eq("team_id", teamId);
  if (delErr) throw new Error(delErr.message);

  const ids = uniq(roleIds);
  if (ids.length) {
    const { error } = await db
      .from("app_team_roles")
      .insert(ids.map((role_id) => ({ team_id: teamId, role_id })));
    if (error) throw new Error(error.message);
  }
  revalidatePath(REV);
}

export async function setCompanyRoles(companyId: string, roleIds: string[]) {
  await guard();
  const db = await createUntypedClient();
  const { error: delErr } = await db
    .from("app_company_roles")
    .delete()
    .eq("company_id", companyId);
  if (delErr) throw new Error(delErr.message);

  const ids = uniq(roleIds);
  if (ids.length) {
    const { error } = await db
      .from("app_company_roles")
      .insert(ids.map((role_id) => ({ company_id: companyId, role_id })));
    if (error) throw new Error(error.message);
  }
  revalidatePath(REV);
}

export async function setCompanyClients(companyId: string, clientIds: string[]) {
  await guard();
  const db = await createUntypedClient();
  const { error: delErr } = await db
    .from("app_company_clients")
    .delete()
    .eq("company_id", companyId);
  if (delErr) throw new Error(delErr.message);

  const ids = uniq(clientIds);
  if (ids.length) {
    const { error } = await db
      .from("app_company_clients")
      .insert(ids.map((client_id) => ({ company_id: companyId, client_id })));
    if (error) throw new Error(error.message);
  }
  revalidatePath(REV);
}

/* ------------------------------------------------------------------ logo (Storage bucket 'org') */

export async function uploadCompanyLogo(formData: FormData) {
  await guard();
  const db = await createUntypedClient();
  const companyId = String(formData.get("company_id") ?? "");
  const file = formData.get("file");
  if (!companyId || !(file instanceof File) || file.size === 0) {
    throw new Error("Arquivo inválido.");
  }
  if (file.size > 4 * 1024 * 1024) throw new Error("Máximo 4 MB.");

  const ext = (file.name.split(".").pop() || "png").toLowerCase().slice(0, 5);
  const path = `${companyId}/${randomUUID()}.${ext}`;
  const { error: upErr } = await db.storage
    .from("org")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (upErr) throw new Error(upErr.message);

  const { data: pub } = db.storage.from("org").getPublicUrl(path);
  const { error } = await db
    .from("app_companies")
    .update({ logo_url: pub.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", companyId);
  if (error) throw new Error(error.message);
  revalidatePath(REV);
}

export async function removeCompanyLogo(id: string) {
  await guard();
  const db = await createUntypedClient();
  const { data: row } = await db
    .from("app_companies")
    .select("logo_url")
    .eq("id", id)
    .maybeSingle();
  const { error } = await db
    .from("app_companies")
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  const url = (row as { logo_url?: string } | null)?.logo_url;
  if (url) {
    const m = url.split("/org/")[1];
    if (m) await db.storage.from("org").remove([m]);
  }
  revalidatePath(REV);
}
