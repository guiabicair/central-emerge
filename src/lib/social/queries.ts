import "server-only";

import { createUntypedClient } from "@/lib/supabase/server";

export interface SocialProject {
  id: string;
  name: string;
  color: string;
  client_id: string | null;
  share_token: string;
  share_expires_at: string | null;
  share_last_viewed_at: string | null;
}

export interface SocialAsset {
  id: string;
  post_id: string;
  format: string;
  image_url: string;
  sort: number;
}

export interface SocialComment {
  id: string;
  post_id: string;
  body: string;
  author_user: string | null;
  author_name: string | null;
  created_at: string;
}

export interface SocialPost {
  id: string;
  project_id: string;
  date: string;
  time: string | null;
  title: string;
  platforms: string[];
  ideia: string | null;
  objetivo: string | null;
  legenda: string | null;
  status: string;
  task_id: string | null;
  position: number;
  assets: SocialAsset[];
  comments: SocialComment[];
}

export interface SocialMarker {
  id: string;
  project_id: string;
  date: string;
  label: string;
  color: string;
}

/** Lista os projetos (cabeçalho). Degrada pra [] se a 0017 não estiver aplicada. */
export async function listSocialProjects(): Promise<SocialProject[]> {
  const db = await createUntypedClient();
  const { data, error } = await db
    .from("social_projects")
    .select(
      "id, name, color, client_id, share_token, share_expires_at, share_last_viewed_at",
    )
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as SocialProject[];
}

export interface SocialProjectData {
  posts: SocialPost[];
  markers: SocialMarker[];
}

/** Posts + assets + comentários + marcadores de UM projeto (tudo, cliente filtra por mês). */
export async function getSocialProjectData(
  projectId: string,
): Promise<SocialProjectData> {
  const db = await createUntypedClient();
  const [postsRes, assetsRes, commentsRes, markersRes] = await Promise.all([
    db
      .from("social_posts")
      .select(
        "id, project_id, date, time, title, platforms, ideia, objetivo, legenda, status, task_id, position",
      )
      .eq("project_id", projectId)
      .order("date")
      .order("time", { nullsFirst: false }),
    db.from("social_post_assets").select("id, post_id, format, image_url, sort"),
    db
      .from("social_post_comments")
      .select("id, post_id, body, author_user, author_name, created_at")
      .order("created_at"),
    db
      .from("social_day_markers")
      .select("id, project_id, date, label, color")
      .eq("project_id", projectId)
      .order("date"),
  ]);

  const posts = (postsRes.data ?? []) as Omit<
    SocialPost,
    "assets" | "comments"
  >[];
  const assets = (assetsRes.data ?? []) as SocialAsset[];
  const comments = (commentsRes.data ?? []) as SocialComment[];
  const postIds = new Set(posts.map((p) => p.id));

  const assetsByPost = new Map<string, SocialAsset[]>();
  for (const a of assets) {
    if (!postIds.has(a.post_id)) continue;
    const arr = assetsByPost.get(a.post_id) ?? [];
    arr.push(a);
    assetsByPost.set(a.post_id, arr);
  }
  const commentsByPost = new Map<string, SocialComment[]>();
  for (const c of comments) {
    if (!postIds.has(c.post_id)) continue;
    const arr = commentsByPost.get(c.post_id) ?? [];
    arr.push(c);
    commentsByPost.set(c.post_id, arr);
  }

  return {
    posts: posts.map((p) => ({
      ...p,
      assets: (assetsByPost.get(p.id) ?? []).sort((a, b) => a.sort - b.sort),
      comments: commentsByPost.get(p.id) ?? [],
    })),
    markers: (markersRes.data ?? []) as SocialMarker[],
  };
}

/** Vista pública por token (RPC SECURITY DEFINER). null se token não casa/expirou. */
export async function getSocialShare(token: string): Promise<unknown | null> {
  const db = await createUntypedClient();
  const { data, error } = await db.rpc("get_social_share", { p_token: token });
  if (error || !data) return null;
  return data;
}
