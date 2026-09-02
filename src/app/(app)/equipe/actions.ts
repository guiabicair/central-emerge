"use server";

import { revalidatePath } from "next/cache";

import { createClient, createUntypedClient } from "@/lib/supabase/server";
import { can } from "@/lib/auth/roles";

async function guard(permission: string) {
  if (!(await can(permission))) {
    throw new Error("Sem permissão para esta ação.");
  }
}

function slugify(raw: string) {
  return raw
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ---------------- Pessoas ---------------- */

export async function setApprovalStatus(
  userId: string,
  status: "approved" | "pending" | "rejected",
) {
  await guard("equipe.approve_users");
  const supabase = await createUntypedClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      approval_status: status,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/equipe/pessoas");
}

export async function setUserRoles(userId: string, roleIds: string[]) {
  await guard("equipe.manage_roles");
  const supabase = await createUntypedClient();

  const { error: delErr } = await supabase
    .from("app_user_roles")
    .delete()
    .eq("user_id", userId);
  if (delErr) throw new Error(delErr.message);

  if (roleIds.length) {
    const { error: insErr } = await supabase
      .from("app_user_roles")
      .insert(roleIds.map((role_id) => ({ user_id: userId, role_id })));
    if (insErr) throw new Error(insErr.message);
  }
  revalidatePath("/equipe/pessoas");
}

/* ---------------- Papéis ---------------- */

export async function createRole(input: {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}) {
  await guard("equipe.manage_roles");
  const supabase = await createUntypedClient();

  const slug = slugify(input.slug || input.name);
  if (!slug || slug === "admin") throw new Error("Slug inválido.");

  const { error } = await supabase.from("app_roles").insert({
    name: input.name.trim(),
    slug,
    description: input.description?.trim() || null,
    color: input.color || null,
    position: 50,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/equipe/papeis");
}

export async function updateRole(
  id: string,
  patch: { name?: string; description?: string | null; color?: string | null },
) {
  await guard("equipe.manage_roles");
  const supabase = await createUntypedClient();
  const { error } = await supabase
    .from("app_roles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/equipe/papeis");
}

export async function deleteRole(id: string) {
  await guard("equipe.manage_roles");
  const supabase = await createUntypedClient();
  const { data: role } = await supabase
    .from("app_roles")
    .select("is_system")
    .eq("id", id)
    .maybeSingle();
  if ((role as { is_system?: boolean } | null)?.is_system) {
    throw new Error("Papel do sistema não pode ser apagado.");
  }
  const { error } = await supabase.from("app_roles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/equipe/papeis");
}

export async function setRolePermission(
  roleId: string,
  permissionKey: string,
  enabled: boolean,
) {
  await guard("equipe.manage_roles");
  const supabase = await createUntypedClient();

  if (enabled) {
    const { error } = await supabase
      .from("app_role_permissions")
      .upsert({ role_id: roleId, permission_key: permissionKey });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("app_role_permissions")
      .delete()
      .eq("role_id", roleId)
      .eq("permission_key", permissionKey);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/equipe/papeis");
}

/* ---------------- Acessos de plataforma ---------------- */

export interface PlatformAccessInput {
  id?: string;
  platform_name: string;
  category: string;
  login_url?: string;
  username?: string;
  password?: string;
  description?: string;
  additional_info?: string;
  is_active?: boolean;
}

export async function savePlatformAccess(input: PlatformAccessInput) {
  await guard("recursos.manage");
  const supabase = await createClient();
  const row = {
    platform_name: input.platform_name.trim(),
    category: input.category,
    login_url: input.login_url?.trim() || null,
    username: input.username?.trim() || null,
    password: input.password?.trim() || null,
    description: input.description?.trim() || null,
    additional_info: input.additional_info?.trim() || null,
    is_active: input.is_active ?? true,
    updated_at: new Date().toISOString(),
  };
  const { error } = input.id
    ? await supabase.from("platform_access").update(row).eq("id", input.id)
    : await supabase.from("platform_access").insert(row);
  if (error) throw new Error(error.message);
  revalidatePath("/equipe/acessos");
}

export async function deletePlatformAccess(id: string) {
  await guard("recursos.manage");
  const supabase = await createClient();
  const { error } = await supabase.from("platform_access").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/equipe/acessos");
}

/* ---------------- Cursos ---------------- */

export interface CourseInput {
  id?: string;
  title: string;
  description?: string;
  link?: string;
  email?: string;
  password?: string;
}

export async function saveCourse(input: CourseInput) {
  await guard("recursos.manage");
  const supabase = await createClient();
  const row = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    link: input.link?.trim() || null,
    email: input.email?.trim() || null,
    password: input.password?.trim() || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = input.id
    ? await supabase.from("courses").update(row).eq("id", input.id)
    : await supabase.from("courses").insert(row);
  if (error) throw new Error(error.message);
  revalidatePath("/equipe/cursos");
}

export async function deleteCourse(id: string) {
  await guard("recursos.manage");
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/equipe/cursos");
}
