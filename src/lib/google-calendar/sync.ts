import { fetchUpcomingEvents, type GoogleEvent } from "@/lib/google-calendar/oauth";
import type { createUntypedClient } from "@/lib/supabase/server";

type Db = Awaited<ReturnType<typeof createUntypedClient>>;

function googleEventToRow(e: GoogleEvent, userId: string) {
  const isAllDay = !!e.start?.date;
  const start = e.start?.dateTime ?? e.start?.date;
  const end = e.end?.dateTime ?? e.end?.date;
  if (!start) return null;
  // attendees da tabela é uuid[] (pessoas internas) — convidados do Google são
  // emails externos, não dá pra mapear 1:1, então viram uma linha na descrição.
  const guestEmails = (e.attendees ?? []).map((a) => a.email).filter(Boolean);
  const description = [e.description, guestEmails.length ? `Convidados: ${guestEmails.join(", ")}` : null]
    .filter(Boolean)
    .join("\n\n") || null;
  return {
    title: e.summary?.trim() || "(sem título)",
    description,
    start_date: new Date(start).toISOString(),
    end_date: end ? new Date(end).toISOString() : null,
    event_type: "meeting",
    location: e.location ?? null,
    is_all_day: isAllDay,
    color: "blue",
    created_by: userId,
    google_event_id: e.id,
    synced_from_google: true,
    updated_at: new Date().toISOString(),
  };
}

/** Busca eventos do Google e faz upsert em calendar_events. Retorna quantos. */
export async function syncEvents(
  db: Db,
  userId: string,
  accessToken: string,
  calendarId: string,
) {
  const events = await fetchUpcomingEvents(accessToken, calendarId);
  const rows = events.map((e) => googleEventToRow(e, userId)).filter((r) => r !== null);

  if (rows.length) {
    const { error } = await db
      .from("calendar_events")
      .upsert(rows, { onConflict: "created_by,google_event_id" });
    if (error) throw new Error(error.message);
  }

  await db
    .from("google_calendar_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", userId);

  return rows.length;
}
