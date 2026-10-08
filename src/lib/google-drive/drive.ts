import "server-only";

import { refreshAccessToken } from "@/lib/google-calendar/oauth";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

// Mesmo OAuth client do Google Calendar (GOOGLE_CALENDAR_CLIENT_ID/SECRET),
// só que com escopo de Drive — precisa da Drive API ativada no projeto do
// Google Cloud e de /api/google-drive/callback nos redirect URIs.
const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

const API = "https://www.googleapis.com/drive/v3";
const FOLDER = "application/vnd.google-apps.folder";

export function buildDriveAuthUrl(redirectUri: string, state: string) {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CALENDAR_CLIENT_ID não configurada nas env vars do Vercel.");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent"); // sempre devolve refresh_token
  url.searchParams.set("state", state);
  return url.toString();
}

export interface DriveConnection {
  google_email: string | null;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  root_folder_id: string | null;
  root_folder_name: string | null;
}

export async function getDriveConnection(): Promise<DriveConnection | null> {
  const { data } = await createUntypedAdminClient()
    .from("google_drive_connection")
    .select("google_email, access_token, refresh_token, token_expires_at, root_folder_id, root_folder_name")
    .maybeSingle();
  return (data as DriveConnection | null) ?? null;
}

export async function getDriveAccessToken(conn: DriveConnection) {
  if (new Date(conn.token_expires_at).getTime() - Date.now() > 60_000) {
    return conn.access_token;
  }
  const fresh = await refreshAccessToken(conn.refresh_token);
  await createUntypedAdminClient()
    .from("google_drive_connection")
    .update({
      access_token: fresh.access_token,
      token_expires_at: new Date(Date.now() + fresh.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  return fresh.access_token;
}

async function drive<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${API}${path}${sep}supportsAllDrives=true`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = new Error(`Google Drive: ${res.status} ${await res.text()}`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  trashed?: boolean;
}

export function getFile(token: string, id: string) {
  return drive<DriveFile>(
    token,
    `/files/${encodeURIComponent(id)}?fields=id,name,mimeType,parents,trashed`,
  );
}

/** Aceita a URL de uma pasta do Drive (…/folders/<id>) ou o id puro. */
export function parseFolderId(input: string) {
  const s = input.trim();
  const m = s.match(/\/folders\/([\w-]+)/) ?? s.match(/[?&]id=([\w-]+)/);
  if (m) return m[1];
  return /^[\w-]{10,}$/.test(s) ? s : null;
}

// "REHABILITE-ME" casa com a pasta "Rehabilite-me", "Rehabilite Me" etc.
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/**
 * Procura uma subpasta pelo nome (comparação normalizada) e cria se não
 * existir. Tenta os nomes na ordem; cria com o primeiro.
 */
export async function findOrCreateFolder(token: string, parentId: string, names: string[]) {
  const q = `'${parentId}' in parents and mimeType='${FOLDER}' and trashed=false`;
  const { files } = await drive<{ files: { id: string; name: string }[] }>(
    token,
    `/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1000&includeItemsFromAllDrives=true`,
  );
  for (const name of names) {
    const hit = files.find((f) => norm(f.name) === norm(name));
    if (hit) return hit.id;
  }
  const created = await drive<{ id: string }>(token, "/files?fields=id", {
    method: "POST",
    body: JSON.stringify({ name: names[0], mimeType: FOLDER, parents: [parentId] }),
  });
  return created.id;
}

/**
 * Abre uma sessão de upload resumable. O browser faz o PUT do arquivo
 * direto nessa URL (sem passar pela Vercel) — o header Origin aqui é o que
 * libera o CORS da sessão pro domínio da Central.
 */
export async function startResumableUpload(
  token: string,
  folderId: string,
  file: { name: string; mimeType: string; size: number },
  origin: string,
) {
  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": file.mimeType || "application/octet-stream",
        "X-Upload-Content-Length": String(file.size),
        Origin: origin,
      },
      body: JSON.stringify({ name: file.name, parents: [folderId] }),
    },
  );
  const location = res.headers.get("location");
  if (!res.ok || !location) {
    const err = new Error(`Google Drive: ${res.status} ${await res.text()}`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  return location;
}

/** "Qualquer pessoa com o link pode ver" — a página pública do cliente precisa. */
export async function shareAnyoneWithLink(token: string, fileId: string) {
  await drive(token, `/files/${encodeURIComponent(fileId)}/permissions?fields=id`, {
    method: "POST",
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });
}

export const driveViewUrl = (id: string) => `https://drive.google.com/file/d/${id}/view`;
