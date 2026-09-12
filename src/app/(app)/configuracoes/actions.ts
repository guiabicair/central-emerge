"use server";

import { revalidatePath } from "next/cache";

import { getUser } from "@/lib/supabase/auth";
import { createUntypedClient } from "@/lib/supabase/server";
import {
  fetchUpcomingEvents,
  refreshAccessToken,
  type GoogleEvent,
} from "@/lib/google-calendar/oauth";

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

function googleEventToRow(e: GoogleEvent, userId: string) {
  const isAllDay = !!e.start?.date;
  const start = e.start?.dateTime ?? e.start?.date;
  const end = e.end?.dateTime ?? e.end?.date;
  if (!start) return null;
  return {
    title: e.summary?.trim() || "(sem título)",
    description: e.description ?? null,
    start_date: new Date(start).toISOString(),
    end_date: end ? new Date(end).toISOString() : null,
    event_type: "meeting",
    location: e.location ?? null,
    attendees: (e.attendees ?? []).map((a) => a.email),
    is_all_day: isAllDay,
    color: "blue",
    created_by: userId,
    google_event_id: e.id,
    synced_from_google: true,
    updated_at: new Date().toISOString(),
  };
}

/** Busca a conexão + puxa os eventos do Google Calendar pro calendar_events. */
export async function syncGoogleCalendarNow() {
  const user = await getUser();
  if (!user) throw new Error("Sem sessão.");
  const db = await createUntypedClient();

  const { data: conn, error: connErr } = await db
    .from("google_calendar_connections")
    .select("user_id, access_token, refresh_token, token_expires_at, calendar_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (connErr) throw new Error(connErr.message);
  if (!conn) throw new Error("Google Calendar não está conectado.");

  const accessToken = await getValidAccessToken(db, conn as Connection);
  const events = await fetchUpcomingEvents(accessToken, (conn as Connection).calendar_id);
  const rows = events.map((e) => googleEventToRow(e, user.id)).filter((r) => r !== null);

  if (rows.length) {
    const { error } = await db
      .from("calendar_events")
      .upsert(rows, { onConflict: "created_by,google_event_id" });
    if (error) throw new Error(error.message);
  }

  await db
    .from("google_calendar_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", user.id);

  revalidatePath("/calendario");
  revalidatePath("/configuracoes");
  return { count: rows.length };
}

export async function disconnectGoogleCalendar() {
  const user = await getUser();
  if (!user) throw new Error("Sem sessão.");
  const db = await createUntypedClient();
  const { error } = await db
    .from("google_calendar_connections")
    .delete()
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/configuracoes");
}
