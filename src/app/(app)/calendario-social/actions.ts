"use server";

import { randomBytes, randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import {
  SOCIAL_PLATFORMS,
  SOCIAL_STATUS,
  type PostInput,
} from "@/app/(app)/calendario-social/social-constants";
import { can } from "@/lib/auth/roles";
import { getUser } from "@/lib/supabase/auth";
import { createUntypedClient } from "@/lib/supabase/server";

async function guard() {
  if (!(await can("social.manage"))) {
    throw new Error("Sem permissão para gerir o calendário social.");
  }
}

const REV = "/calendario-social";

/* ------------------------------------------------------------------ projetos */

export async function createProject(name: string, color: string) {
  await guard();
  const user = await getUser();
  const db = await createUntypedClient();
  const clean = name.trim().slice(0, 80);
  if (!clean) throw new Error("Nome é obrigatório.");
  const { data, error } = await db
    .from("social_projects")
    .insert({ name: clean, color: color || "#45f0d1", created_by: user?.id ?? null })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Falhou ao criar projeto.");
  revalidatePath(REV);
  return { id: (data as { id: string }).id };
}

export async function deleteProject(id: string) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db.from("social_projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(REV);
}

export async function regenShareToken(id: string) {
  await guard();
  const db = await createUntypedClient();
  const token = randomBytes(18).toString("hex"); // 144 bits, mesmo do default da 0017
  const { error } = await db
    .from("social_projects")
    .update({ share_token: token, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(REV);
  return { token };
}

export async function setShareExpiry(id: string, days: number | null) {
  await guard();
  const db = await createUntypedClient();
  const expires =
    days && days > 0
      ? new Date(Date.now() + days * 86400_000).toISOString()
      : null;
  const { error } = await db
    .from("social_projects")
    .update({ share_expires_at: expires, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(REV);
}

/* ------------------------------------------------------------------ marcadores */

export async function addMarker(
  projectId: string,
  date: string,
  label: string,
  color: string,
) {
  await guard();
  const user = await getUser();
  const db = await createUntypedClient();
  if (!label.trim()) throw new Error("Descrição é obrigatória.");
  const { error } = await db.from("social_day_markers").insert({
    project_id: projectId,
    date,
    label: label.trim().slice(0, 120),
    color: color || "#f2b544",
    created_by: user?.id ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(REV);
}

export async function deleteMarker(id: string) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db.from("social_day_markers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(REV);
}

/* ------------------------------------------------------------------ posts */

function sanitizePost(input: PostInput) {
  const platforms = (input.platforms ?? []).filter((p) =>
    (SOCIAL_PLATFORMS as readonly string[]).includes(p),
  );
  return {
    date: input.date,
    time: input.time || null,
    title: input.title.trim().slice(0, 160) || "(sem título)",
    platforms,
    ideia: input.ideia?.trim() || null,
    objetivo: input.objetivo?.trim() || null,
    legenda: input.legenda?.trim() || null,
    task_id: input.task_id || null,
  };
}

export async function createPost(projectId: string, input: PostInput) {
  await guard();
  const user = await getUser();
  const db = await createUntypedClient();
  const { data, error } = await db
    .from("social_posts")
    .insert({ project_id: projectId, ...sanitizePost(input), created_by: user?.id ?? null })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Falhou ao criar post.");
  revalidatePath(REV);
  return { id: (data as { id: string }).id };
}

export async function updatePost(id: string, input: PostInput) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db
    .from("social_posts")
    .update({ ...sanitizePost(input), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(REV);
}

export async function deletePost(id: string) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db.from("social_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(REV);
}

export async function setPostStatus(id: string, status: string) {
  await guard();
  if (!(SOCIAL_STATUS as readonly string[]).includes(status)) {
    throw new Error("Status inválido.");
  }
  const db = await createUntypedClient();
  const { error } = await db
    .from("social_posts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(REV);
}

export async function movePostDate(id: string, date: string) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db
    .from("social_posts")
    .update({ date, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(REV);
}

/* ------------------------------------------------------------------ comentários (interno) */

export async function addComment(postId: string, body: string) {
  await guard();
  const user = await getUser();
  const db = await createUntypedClient();
  const clean = body.trim();
  if (!clean) throw new Error("Comentário vazio.");
  const { error } = await db.from("social_post_comments").insert({
    post_id: postId,
    body: clean.slice(0, 2000),
    author_user: user?.id ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(REV);
}

export async function deleteComment(id: string) {
  await guard();
  const db = await createUntypedClient();
  const { error } = await db.from("social_post_comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(REV);
}

/* ------------------------------------------------------------------ artes (Storage) */

export async function uploadAsset(formData: FormData) {
  await guard();
  const db = await createUntypedClient();
  const postId = String(formData.get("post_id") ?? "");
  const format = String(formData.get("format") ?? "feed_1_1");
  const file = formData.get("file");
  if (!postId || !(file instanceof File) || file.size === 0) {
    throw new Error("Arquivo inválido.");
  }
  if (file.size > 12 * 1024 * 1024) throw new Error("Máximo 12 MB.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
  // path aleatório: bucket é read-público, não pode ser enumerável (Régie #2)
  const path = `${postId}/${randomUUID()}.${ext}`;
  const { error: upErr } = await db.storage
    .from("social")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (upErr) throw new Error(upErr.message);
  const { data: pub } = db.storage.from("social").getPublicUrl(path);
  const { error: insErr } = await db.from("social_post_assets").insert({
    post_id: postId,
    format,
    image_url: pub.publicUrl,
    sort: Date.now() % 100000,
  });
  if (insErr) throw new Error(insErr.message);
  revalidatePath(REV);
}

export async function deleteAsset(id: string) {
  await guard();
  const db = await createUntypedClient();
  const { data: row } = await db
    .from("social_post_assets")
    .select("image_url")
    .eq("id", id)
    .single();
  const { error } = await db.from("social_post_assets").delete().eq("id", id);
  if (error) throw new Error(error.message);
  // best-effort: remove do storage (path = tudo depois de /social/)
  const url = (row as { image_url?: string } | null)?.image_url;
  if (url) {
    const m = url.split("/social/")[1];
    if (m) await db.storage.from("social").remove([m]);
  }
  revalidatePath(REV);
}
