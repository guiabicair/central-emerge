-- ============================================================
-- Google Calendar — conexão OAuth por usuário + eventos sincronizados
-- Aditivo: nada existente é tocado.
-- ============================================================

create table if not exists public.google_calendar_connections (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references auth.users(id) on delete cascade,
  google_email     text,
  access_token     text not null,
  refresh_token    text not null,
  token_expires_at timestamptz not null,
  calendar_id      text not null default 'primary',
  last_synced_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.google_calendar_connections enable row level security;

create policy google_calendar_connections_own on public.google_calendar_connections
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.calendar_events add column if not exists google_event_id text;
alter table public.calendar_events add column if not exists synced_from_google boolean not null default false;

create unique index if not exists calendar_events_google_uidx
  on public.calendar_events(created_by, google_event_id)
  where google_event_id is not null;
