"use server";

import { revalidatePath } from "next/cache";

import { getUser } from "@/lib/supabase/auth";
import { createUntypedClient } from "@/lib/supabase/server";
import { refreshAccessToken } from "@/lib/google-calendar/oauth";
import { syncEvents } from "@/lib/google-calendar/sync";

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
