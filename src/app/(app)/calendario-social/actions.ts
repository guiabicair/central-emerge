"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import {
  SOCIAL_PLATFORMS,
  SOCIAL_STATUS,
  type PostInput,
} from "@/app/(app)/calendario-social/social-constants";
import { can } from "@/lib/auth/roles";
import {
  driveViewUrl,
  findOrCreateFolder,
  getDriveAccessToken,
  getDriveConnection,
  getFile,
  shareAnyoneWithLink,
  startResumableUpload,
} from "@/lib/google-drive/drive";
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

/**
 * Cria a task espelho de um post social (título + prazo = data do post),
 * já preenchendo o vínculo nos dois sentidos. Usada quando o post é criado
 * sem uma tarefa manual selecionada — assim toda peça de social vira
 * automaticamente uma tarefa real em /tarefas, sem passo manual extra.
 */
async function createMirrorTask(
  db: Awaited<ReturnType<typeof createUntypedClient>>,
  title: string,
  date: string,
  userId: string | null,
) {
  const { data: cols } = await db
    .from("task_statuses")
    .select("name, position")
    .order("position")
    .limit(1);
  const fallbackStatus = (cols?.[0] as { name: string } | undefined)?.name ?? "pending";
  const { data, error } = await db
    .from("tasks")
    .insert({
      title: `[Social] ${title}`,
      status: fallbackStatus,
      priority: "medium",
      due_date: date,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return (data as { id: string }).id;
}

/**
 * Posts criados antes da task espelho existir (ou cuja criação falhou)
 * ficam sem tarefa — cria na primeira edição/upload.
 */
async function ensureMirrorTask(
  db: Awaited<ReturnType<typeof createUntypedClient>>,
  postId: string,
) {
  const { data } = await db
    .from("social_posts")
    .select("title, date, task_id")
    .eq("id", postId)
    .single();
  const post = data as { title: string; date: string; task_id: string | null } | null;
  if (!post || post.task_id) return;
  const user = await getUser();
  const taskId = await createMirrorTask(db, post.title, post.date, user?.id ?? null);
  if (taskId) await db.from("social_posts").update({ task_id: taskId }).eq("id", postId);
}

export async function createPost(projectId: string, input: PostInput) {
  await guard();
  const user = await getUser();
  const db = await createUntypedClient();

  let taskId = input.task_id || null;
  if (!taskId) {
    taskId = await createMirrorTask(db, input.title.trim() || "(sem título)", input.date, user?.id ?? null);
  }

  const { data, error } = await db
    .from("social_posts")
    .insert({
      project_id: projectId,
      ...sanitizePost(input),
      task_id: taskId,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Falhou ao criar post.");
  revalidatePath(REV);
  revalidatePath("/tarefas");
  return { id: (data as { id: string }).id };
}

export async function updatePost(id: string, input: PostInput) {
  await guard();
  const db = await createUntypedClient();
  const { task_id, ...fields } = sanitizePost(input);
  const { error } = await db
    .from("social_posts")
    // sem tarefa escolhida = mantém a atual (a espelho); gravar null aqui
    // com o form desatualizado faria ensureMirrorTask criar duplicata
    .update({
      ...fields,
      ...(task_id ? { task_id } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await ensureMirrorTask(db, id);
  revalidatePath(REV);
  revalidatePath("/tarefas");
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

/**
 * Registra uma arte (imagem ou vídeo) que o browser já subiu direto pro
 * bucket `social` — o arquivo não passa pelo server action, senão vídeo
 * estoura o limite de body do Next (1 MB) e da Vercel (4.5 MB).
 */
export async function registerAsset(postId: string, format: string, path: string) {
  await guard();
  // path gerado no client como `${postId}/${uuid}.${ext}` — não aceita outro
  if (!postId || !/^[\w-]+\/[\w-]+\.[a-z0-9]{1,5}$/i.test(path) || !path.startsWith(`${postId}/`)) {
    throw new Error("Arquivo inválido.");
  }
  const db = await createUntypedClient();
  const { data: pub } = db.storage.from("social").getPublicUrl(path);
  const { error: insErr } = await db.from("social_post_assets").insert({
    post_id: postId,
    format,
    image_url: pub.publicUrl,
    sort: Date.now() % 100000,
  });
  if (insErr) throw new Error(insErr.message);
  await ensureMirrorTask(db, postId);
  revalidatePath(REV);
  revalidatePath("/tarefas");
}

/* ------------------------------------------------------------------ artes (Google Drive) */

type Db = Awaited<ReturnType<typeof createUntypedClient>>;

/**
 * Pasta do post no Drive: <raiz>/<cliente>/Social/<data – título>. Usa a
 * pasta do cliente se já existir (nome comparado sem acento/caixa), cria o
 * que faltar, e guarda os ids pra não procurar de novo.
 */
async function resolvePostFolder(db: Db, token: string, rootId: string, postId: string) {
  const { data: postRow } = await db
    .from("social_posts")
    .select("title, date, project_id, drive_folder_id")
    .eq("id", postId)
    .single();
  const post = postRow as {
    title: string;
    date: string;
    project_id: string;
    drive_folder_id: string | null;
  } | null;
  if (!post) throw new Error("Post não encontrado.");
  if (post.drive_folder_id) return post.drive_folder_id;

  const { data: projRow } = await db
    .from("social_projects")
    .select("name, client_id, drive_folder_id")
    .eq("id", post.project_id)
    .single();
  const proj = projRow as { name: string; client_id: string | null; drive_folder_id: string | null } | null;
  if (!proj) throw new Error("Projeto não encontrado.");

  let socialFolder = proj.drive_folder_id;
  if (!socialFolder) {
    const names = [proj.name];
    if (proj.client_id) {
      const { data: c } = await db.from("clients").select("name").eq("id", proj.client_id).single();
      const clientName = (c as { name: string } | null)?.name;
      if (clientName) names.push(clientName);
    }
    const clientFolder = await findOrCreateFolder(token, rootId, names);
    socialFolder = await findOrCreateFolder(token, clientFolder, ["Social"]);
    await db.from("social_projects").update({ drive_folder_id: socialFolder }).eq("id", post.project_id);
  }

  const folderName = `${post.date} – ${post.title}`.replace(/[\\/]/g, "-").slice(0, 120);
  const postFolder = await findOrCreateFolder(token, socialFolder, [folderName]);
  await db.from("social_posts").update({ drive_folder_id: postFolder }).eq("id", postId);
  return postFolder;
}

/**
 * Abre o upload de uma arte direto pro Drive da Emerge. Devolve a URL de
 * upload (o browser manda o arquivo pra ela, sem passar pela Vercel) ou
 * `drive: false` se o Drive não estiver configurado — aí o client cai pro
 * Storage do Supabase. Erro volta como dado: em produção o Next apaga a
 * mensagem de exceptions de Server Action.
 */
export async function startDriveUpload(
  postId: string,
  file: { name: string; mimeType: string; size: number },
): Promise<{ drive: false } | { drive: true; uploadUrl: string } | { error: string }> {
  if (!(await can("social.manage"))) return { error: "Sem permissão para gerir o calendário social." };
  const conn = await getDriveConnection().catch(() => null);
  if (!conn?.root_folder_id) return { drive: false };

  const origin = (await headers()).get("origin");
  if (!origin) return { error: "Requisição sem origin." };
  const db = await createUntypedClient();
  try {
    const token = await getDriveAccessToken(conn);
    const open = async () =>
      startResumableUpload(
        token,
        await resolvePostFolder(db, token, conn.root_folder_id!, postId),
        { name: file.name.slice(0, 200), mimeType: file.mimeType, size: file.size },
        origin,
      );
    try {
      return { drive: true, uploadUrl: await open() };
    } catch (e) {
      // pasta em cache foi apagada/movida no Drive → limpa o cache e recria
      if ((e as { status?: number }).status !== 404) throw e;
      const { data: p } = await db.from("social_posts").select("project_id").eq("id", postId).single();
      await db.from("social_posts").update({ drive_folder_id: null }).eq("id", postId);
      if (p) {
        await db
          .from("social_projects")
          .update({ drive_folder_id: null })
          .eq("id", (p as { project_id: string }).project_id);
      }
      return { drive: true, uploadUrl: await open() };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falhou ao abrir upload no Drive." };
  }
}

/** Depois do upload: libera o link pra leitura e registra a arte no post. */
export async function finishDriveUpload(
  postId: string,
  format: string,
  fileId: string,
): Promise<{ error?: string }> {
  if (!(await can("social.manage"))) return { error: "Sem permissão para gerir o calendário social." };
  const conn = await getDriveConnection().catch(() => null);
  if (!conn) return { error: "Google Drive não está conectado." };
  const db = await createUntypedClient();
  try {
    const token = await getDriveAccessToken(conn);
    const { data: p } = await db.from("social_posts").select("drive_folder_id").eq("id", postId).single();
    const folder = (p as { drive_folder_id: string | null } | null)?.drive_folder_id;
    const f = await getFile(token, fileId);
    // só aceita arquivo que caiu na pasta deste post (não um id qualquer)
    if (!folder || !f.parents?.includes(folder)) return { error: "Arquivo fora da pasta do post." };
    await shareAnyoneWithLink(token, f.id);
    const { error } = await db.from("social_post_assets").insert({
      post_id: postId,
      format,
      image_url: driveViewUrl(f.id),
      sort: Date.now() % 100000,
    });
    if (error) return { error: error.message };
    await ensureMirrorTask(db, postId);
    revalidatePath(REV);
    revalidatePath("/tarefas");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falhou ao registrar no Drive." };
  }
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
