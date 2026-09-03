-- Cronogramas — tabelas novas (nossas, prefixo app_cronograma_*). FK só
-- entre elas (on delete cascade). client_id/project_id/task_id são uuid
-- solto + index (padrão app_canvas, sem tocar o grafo de constraints do
-- schema Lovable). RLS reusa clientes.view/manage. Vista pública por
-- token via RPC SECURITY DEFINER. Idempotente. ACK Régie (0015).

create extension if not exists pgcrypto;

create table if not exists public.app_cronogramas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  client_id uuid,
  project_id uuid,
  project_kind text check (project_kind in ('recurring', 'specific')),
  start_date date,
  end_date date,
  current_fase_id uuid,
  template_key text,
  share_token text unique not null default encode(gen_random_bytes(18), 'hex'),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists app_cronogramas_client_idx
  on public.app_cronogramas (client_id);

create table if not exists public.app_cronograma_fases (
  id uuid primary key default gen_random_uuid(),
  cronograma_id uuid not null
    references public.app_cronogramas (id) on delete cascade,
  title text not null,
  note text,
  interval_label text,
  start_date date,
  end_date date,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists app_cronograma_fases_crono_idx
  on public.app_cronograma_fases (cronograma_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'app_cronogramas_current_fase_fk'
  ) then
    alter table public.app_cronogramas
      add constraint app_cronogramas_current_fase_fk
      foreign key (current_fase_id)
      references public.app_cronograma_fases (id) on delete set null;
  end if;
end $$;

create table if not exists public.app_cronograma_itens (
  id uuid primary key default gen_random_uuid(),
  cronograma_id uuid not null
    references public.app_cronogramas (id) on delete cascade,
  fase_id uuid not null
    references public.app_cronograma_fases (id) on delete cascade,
  text text not null,
  status text not null default 'a_fazer'
    check (status in ('concluido', 'em_andamento', 'agendado', 'a_fazer')),
  date date,
  task_id uuid,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists app_cronograma_itens_crono_idx
  on public.app_cronograma_itens (cronograma_id);
create index if not exists app_cronograma_itens_fase_idx
  on public.app_cronograma_itens (fase_id);
create index if not exists app_cronograma_itens_date_idx
  on public.app_cronograma_itens (date) where date is not null;

create table if not exists public.app_cronograma_checklists (
  id uuid primary key default gen_random_uuid(),
  cronograma_id uuid not null
    references public.app_cronogramas (id) on delete cascade,
  title text not null,
  position int not null default 0
);
create index if not exists app_cronograma_checklists_crono_idx
  on public.app_cronograma_checklists (cronograma_id);

create table if not exists public.app_cronograma_checklist_itens (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null
    references public.app_cronograma_checklists (id) on delete cascade,
  text text not null,
  done boolean not null default false,
  position int not null default 0
);
create index if not exists app_cronograma_checklist_itens_cl_idx
  on public.app_cronograma_checklist_itens (checklist_id);

create table if not exists public.app_cronograma_secoes (
  id uuid primary key default gen_random_uuid(),
  cronograma_id uuid not null
    references public.app_cronogramas (id) on delete cascade,
  kind text not null default 'livre'
    check (kind in ('roteiro', 'calendario', 'livre')),
  title text not null,
  body jsonb not null default '[]'::jsonb,
  position int not null default 0
);
create index if not exists app_cronograma_secoes_crono_idx
  on public.app_cronograma_secoes (cronograma_id);

-- RLS: SELECT clientes.view · ALL clientes.manage (nas 6 tabelas)
do $$
declare
  t text;
begin
  foreach t in array array[
    'app_cronogramas', 'app_cronograma_fases', 'app_cronograma_itens',
    'app_cronograma_checklists', 'app_cronograma_checklist_itens',
    'app_cronograma_secoes'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t
        and policyname = 'cronogramas view'
    ) then
      execute format(
        'create policy %I on public.%I for select to authenticated using (app_has_permission(auth.uid(), %L))',
        'cronogramas view', t, 'clientes.view'
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t
        and policyname = 'cronogramas manage'
    ) then
      execute format(
        'create policy %I on public.%I for all to authenticated using (app_has_permission(auth.uid(), %L)) with check (app_has_permission(auth.uid(), %L))',
        'cronogramas manage', t, 'clientes.manage', 'clientes.manage'
      );
    end if;
  end loop;
end $$;

-- Vista pública por token (sem login). Sem ids internos no payload.
create or replace function public.get_cronograma_by_token(p_token text)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'cronograma',
      to_jsonb(c.*)
        - 'share_token' - 'created_by' - 'client_id'
        - 'project_id' - 'project_kind',
    'fases', coalesce((
      select jsonb_agg(to_jsonb(f.*) order by f.position, f.created_at)
      from public.app_cronograma_fases f where f.cronograma_id = c.id
    ), '[]'::jsonb),
    'itens', coalesce((
      select jsonb_agg((to_jsonb(i.*) - 'task_id') order by i.position, i.created_at)
      from public.app_cronograma_itens i where i.cronograma_id = c.id
    ), '[]'::jsonb),
    'checklists', coalesce((
      select jsonb_agg(jsonb_build_object(
        'checklist', to_jsonb(cl.*),
        'itens', coalesce((
          select jsonb_agg(to_jsonb(ci.*) order by ci.position)
          from public.app_cronograma_checklist_itens ci
          where ci.checklist_id = cl.id
        ), '[]'::jsonb)
      ) order by cl.position)
      from public.app_cronograma_checklists cl where cl.cronograma_id = c.id
    ), '[]'::jsonb),
    'secoes', coalesce((
      select jsonb_agg(to_jsonb(s.*) order by s.position)
      from public.app_cronograma_secoes s where s.cronograma_id = c.id
    ), '[]'::jsonb)
  )
  from public.app_cronogramas c
  where c.share_token = p_token;
$$;

grant execute on function public.get_cronograma_by_token(text)
  to anon, authenticated;
