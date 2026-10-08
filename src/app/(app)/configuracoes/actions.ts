"use server";

import { revalidatePath } from "next/cache";

import { getUser } from "@/lib/supabase/auth";
import { createUntypedClient } from "@/lib/supabase/server";
import { refreshAccessToken } from "@/lib/google-calendar/oauth";
import { syncEvents } from "@/lib/google-calendar/sync";
import { getSessionAccess } from "@/lib/auth/roles";
import {
  getDriveAccessToken,
  getDriveConnection,
  getFile,
  parseFolderId,
} from "@/lib/google-drive/drive";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

interface Connection {
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  calendar_id: string;
}

async function getValidAccessToken(db: Awaited<ReturnType<typeof createUntypedClient>>, conn: Connection) {
  const expiresAt = new Date(conn.token_expires_at).getTime();
  if (expiresAt - Date.now() > 60_000) return conn.access_token;

  const fresh = await refreshAccessToken(conn.refresh_token);
  await db
    .from("google_calendar_connections")
    .update({
      access_token: fresh.access_token,
      token_expires_at: new Date(Date.now() + fresh.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", conn.user_id);
  return fresh.access_token;
}

/**
 * Busca a conexão + puxa os eventos do Google Calendar pro calendar_events.
 * Retorna `{ error }` em vez de lançar — em produção o Next apaga a mensagem
 * de exceptions de Server Action (React #441), então erro esperado sempre
 * volta como dado (mesmo padrão do useAct() de equipe/org-view.tsx).
 */
export async function syncGoogleCalendarNow(): Promise<{ count?: number; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Sem sessão." };
  const db = await createUntypedClient();

  const { data: conn, error: connErr } = await db
    .from("google_calendar_connections")
    .select("user_id, access_token, refresh_token, token_expires_at, calendar_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (connErr) return { error: connErr.message };
  if (!conn) return { error: "Google Calendar não está conectado." };

  try {
    const accessToken = await getValidAccessToken(db, conn as Connection);
    const count = await syncEvents(db, user.id, accessToken, (conn as Connection).calendar_id);
    revalidatePath("/calendario");
    revalidatePath("/configuracoes");
    return { count };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao sincronizar." };
  }
}

export async function disconnectGoogleCalendar(): Promise<{ error?: string } | void> {
  const user = await getUser();
  if (!user) return { error: "Sem sessão." };
  const db = await createUntypedClient();
  const { error } = await db
    .from("google_calendar_connections")
    .delete()
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
}

/* ------------------------------------------------------------ Google Drive */

/** Define a pasta raiz dos clientes no Drive (URL da pasta ou id). Só admin. */
export async function setDriveRootFolder(input: string): Promise<{ error?: string; name?: string }> {
  if (!(await getSessionAccess()).isAdmin) return { error: "Só admin altera o Drive." };
  const folderId = parseFolderId(input);
  if (!folderId) return { error: "Cole o link de uma pasta do Drive." };
  const conn = await getDriveConnection();
  if (!conn) return { error: "Conecte o Google Drive primeiro." };
  try {
    const token = await getDriveAccessToken(conn);
    const f = await getFile(token, folderId);
    if (f.mimeType !== "application/vnd.google-apps.folder" || f.trashed) {
      return { error: "Esse link não é de uma pasta (ou ela está na lixeira)." };
    }
    const db = createUntypedAdminClient();
    const { error } = await db
      .from("google_drive_connection")
      .update({ root_folder_id: f.id, root_folder_name: f.name, updated_at: new Date().toISOString() })
      .eq("id", true);
    if (error) return { error: error.message };
    // pastas em cache apontavam pra raiz antiga
    await db.from("social_projects").update({ drive_folder_id: null }).not("drive_folder_id", "is", null);
    await db.from("social_posts").update({ drive_folder_id: null }).not("drive_folder_id", "is", null);
    revalidatePath("/configuracoes");
    return { name: f.name };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falhou ao ler a pasta." };
  }
}

/** Desconecta o Drive. Arquivos já enviados continuam no Drive e nos posts. */
export async function disconnectGoogleDrive(): Promise<{ error?: string } | void> {
  if (!(await getSessionAccess()).isAdmin) return { error: "Só admin altera o Drive." };
  const { error } = await createUntypedAdminClient()
    .from("google_drive_connection")
    .delete()
    .eq("id", true);
  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
}
