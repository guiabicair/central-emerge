-- ============================================================
-- Central Emerge — Operações/Agentes: log de atividade + roadmap
-- por projeto, escrito por agentes Claude Code rodando em QUALQUER
-- terminal/projeto Maestri (via RPC, sem passar pela Central).
-- Tabelas novas com prefixo ops_ (não colidem com o schema Lovable
-- nem com as app_* de permissões). Aditivo: nada existente é tocado.
-- ============================================================

-- 1. Projetos (registro de "quem" reporta) -------------------------------
create table if not exists public.ops_projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  repo_url    text,
  description text,
  status      text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at  timestamptz not null default now()
);

-- 2. Roadmap por projeto (board pendente/em progresso/bloqueado/feito) --
create table if not exists public.ops_roadmap_items (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.ops_projects(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'backlog' check (status in ('backlog', 'in_progress', 'blocked', 'done')),
  priority    text check (priority in ('p0', 'p1', 'p2', 'p3')),
  agent_name  text,
  link        text,
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ops_roadmap_items_project_idx on public.ops_roadmap_items(project_id);

-- 3. Log de atividade dos agentes (feed cronológico) ---------------------
create table if not exists public.ops_agent_activity (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.ops_projects(id) on delete cascade,
  agent_name       text not null,
  event_type       text not null default 'completed' check (event_type in ('started', 'progress', 'completed', 'blocked', 'deployed')),
  summary          text not null,
  detail           text,
  link             text,
  roadmap_item_id  uuid references public.ops_roadmap_items(id) on delete set null,
  created_at       timestamptz not null default now()
);

create index if not exists ops_agent_activity_project_idx on public.ops_agent_activity(project_id);
create index if not exists ops_agent_activity_created_idx on public.ops_agent_activity(created_at desc);

-- 4. Permissões (catálogo em app_permissions, migration 0001) -----------
insert into public.app_permissions (key, label, area, position) values
  ('ops.view',   'Ver operações e atividade dos agentes', 'Operações', 140),
  ('ops.manage', 'Gerir projetos e roadmap de operações',  'Operações', 141)
on conflict (key) do nothing;

-- 5. RLS — leitura/gestão pela Central (humanos logados) ----------------
alter table public.ops_projects enable row level security;
alter table public.ops_roadmap_items enable row level security;
alter table public.ops_agent_activity enable row level security;

create policy ops_projects_select on public.ops_projects
  for select to authenticated
  using (public.app_has_permission(auth.uid(), 'ops.view'));

create policy ops_projects_write on public.ops_projects
  for all to authenticated
  using (public.app_has_permission(auth.uid(), 'ops.manage'))
  with check (public.app_has_permission(auth.uid(), 'ops.manage'));

create policy ops_roadmap_items_select on public.ops_roadmap_items
  for select to authenticated
  using (public.app_has_permission(auth.uid(), 'ops.view'));

create policy ops_roadmap_items_write on public.ops_roadmap_items
  for all to authenticated
  using (public.app_has_permission(auth.uid(), 'ops.manage'))
  with check (public.app_has_permission(auth.uid(), 'ops.manage'));

create policy ops_agent_activity_select on public.ops_agent_activity
  for select to authenticated
  using (public.app_has_permission(auth.uid(), 'ops.view'));

create policy ops_agent_activity_write on public.ops_agent_activity
  for all to authenticated
  using (public.app_has_permission(auth.uid(), 'ops.manage'))
  with check (public.app_has_permission(auth.uid(), 'ops.manage'));

-- 6. RPCs — a "porta de entrada" dos agentes externos --------------------
-- SECURITY DEFINER (bypassa a RLS acima por dentro, superfície controlada
-- pelos parâmetros/CHECKs), mesmo padrão já usado em 0017 (funções sociais
-- públicas via anon). Sem tabela aberta pra INSERT/UPDATE de anon direto.

create or replace function public.ops_ensure_project(p_slug text, p_name text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_slug is null or trim(p_slug) = '' then
    raise exception 'project_slug é obrigatório';
  end if;

  select id into v_id from public.ops_projects where slug = trim(p_slug);
  if v_id is null then
    insert into public.ops_projects (slug, name)
    values (trim(p_slug), coalesce(nullif(trim(p_name), ''), trim(p_slug)))
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

create or replace function public.ops_report_activity(
  p_project_slug text,
  p_agent_name text,
  p_summary text,
  p_event_type text default 'completed',
  p_detail text default null,
  p_link text default null,
  p_roadmap_item_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_id uuid;
  v_id uuid;
begin
  if p_agent_name is null or trim(p_agent_name) = '' then
    raise exception 'agent_name é obrigatório';
  end if;
  if p_summary is null or trim(p_summary) = '' then
    raise exception 'summary é obrigatório';
  end if;

  v_project_id := public.ops_ensure_project(p_project_slug, null);

  insert into public.ops_agent_activity
    (project_id, agent_name, event_type, summary, detail, link, roadmap_item_id)
  values
    (v_project_id, trim(p_agent_name), coalesce(nullif(trim(p_event_type), ''), 'completed'),
     trim(p_summary), nullif(trim(p_detail), ''), nullif(trim(p_link), ''), p_roadmap_item_id)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.ops_upsert_roadmap_item(
  p_project_slug text,
  p_title text default null,
  p_item_id uuid default null,
  p_status text default null,
  p_priority text default null,
  p_agent_name text default null,
  p_link text default null,
  p_description text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project_id uuid;
  v_id uuid;
begin
  v_project_id := public.ops_ensure_project(p_project_slug, null);

  if p_item_id is not null then
    update public.ops_roadmap_items set
      title       = coalesce(nullif(trim(p_title), ''), title),
      status      = coalesce(p_status, status),
      priority    = coalesce(p_priority, priority),
      agent_name  = coalesce(nullif(trim(p_agent_name), ''), agent_name),
      link        = coalesce(nullif(trim(p_link), ''), link),
      description = coalesce(nullif(trim(p_description), ''), description),
      updated_at  = now()
    where id = p_item_id and project_id = v_project_id
    returning id into v_id;

    if v_id is null then
      raise exception 'item de roadmap não encontrado para este projeto';
    end if;
  else
    if p_title is null or trim(p_title) = '' then
      raise exception 'title é obrigatório para criar um item de roadmap novo';
    end if;

    insert into public.ops_roadmap_items
      (project_id, title, status, priority, agent_name, link, description)
    values
      (v_project_id, trim(p_title), coalesce(p_status, 'backlog'), p_priority,
       nullif(trim(p_agent_name), ''), nullif(trim(p_link), ''), nullif(trim(p_description), ''))
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

grant execute on function public.ops_ensure_project(text, text) to anon, authenticated;
grant execute on function public.ops_report_activity(text, text, text, text, text, text, uuid) to anon, authenticated;
grant execute on function public.ops_upsert_roadmap_item(text, text, uuid, text, text, text, text, text) to anon, authenticated;

-- 7. Seed — os 2 projetos que já existem hoje ----------------------------
insert into public.ops_projects (slug, name, repo_url, description) values
  ('central-emerge',   'Central Emerge',        'emerge-propostas-work', 'Hub interno (CRM + operações) da Emerge — este projeto.'),
  ('emerge-propostas', 'Gerador de Propostas',  'emerge-propostas',      'Página de propostas com IA (Gemini) + cobrança via Asaas.')
on conflict (slug) do nothing;
