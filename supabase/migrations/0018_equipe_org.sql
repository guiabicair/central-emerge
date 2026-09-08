-- EPIC Equipe / Organização — TREM 1A (só schema).
-- Empresas / times / vínculos de pessoa-papel-cliente por empresa, com hierarquia
-- de empresa (parent_id) e "empresa ativa" por usuário. Prefixo app_*.
-- FK entre as tabelas novas + para auth.users / app_roles; client_id é BARE
-- (sem FK formal, padrão canvas/cronogramas — não toca o grafo Lovable).
-- ADITIVO + IDEMPOTENTE (create ... if not exists, on conflict do nothing,
-- do-block com guarda em pg_policies, %I no nome de policy — os nomes têm espaço).
-- app_has_permission INTOCADA. Sem UI, sem seed de vínculo. ACK Régie (EPIC Equipe/Org).

create extension if not exists pgcrypto;

-- ------------------------------------------------------------ 1. empresas
create table if not exists public.app_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  color text,
  parent_id uuid references public.app_companies (id) on delete set null,
  frente_slug text,
  logo_url text,
  is_active_default boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------ 2. times
create table if not exists public.app_teams (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.app_companies (id) on delete cascade,
  name text not null,
  color text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------ 3. pessoas x time
create table if not exists public.app_team_members (
  team_id uuid not null references public.app_teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  is_lead boolean not null default false,
  primary key (team_id, user_id)
);

-- ------------------------------------------------------------ 4. pessoas x empresa
create table if not exists public.app_company_members (
  company_id uuid not null references public.app_companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (company_id, user_id)
);

-- ------------------------------------------------------------ 5. papéis x time
create table if not exists public.app_team_roles (
  team_id uuid not null references public.app_teams (id) on delete cascade,
  role_id uuid not null references public.app_roles (id) on delete cascade,
  primary key (team_id, role_id)
);

-- ------------------------------------------------------------ 6. papéis x empresa
create table if not exists public.app_company_roles (
  company_id uuid not null references public.app_companies (id) on delete cascade,
  role_id uuid not null references public.app_roles (id) on delete cascade,
  primary key (company_id, role_id)
);

-- ------------------------------------------------------------ 7. clientes x empresa (client_id BARE)
create table if not exists public.app_company_clients (
  company_id uuid not null references public.app_companies (id) on delete cascade,
  client_id uuid not null,
  primary key (company_id, client_id)
);

-- ------------------------------------------------------------ 8. preferência por usuário
create table if not exists public.app_user_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  active_company_id uuid references public.app_companies (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------ índices reversos (1B precisa)
create index if not exists app_team_members_user_idx    on public.app_team_members (user_id);
create index if not exists app_company_members_user_idx on public.app_company_members (user_id);
create index if not exists app_team_roles_role_idx      on public.app_team_roles (role_id);
create index if not exists app_company_roles_role_idx   on public.app_company_roles (role_id);
create index if not exists app_company_clients_client_idx on public.app_company_clients (client_id);
create index if not exists app_companies_parent_idx     on public.app_companies (parent_id);
create index if not exists app_companies_frente_idx     on public.app_companies (frente_slug);
create index if not exists app_teams_company_idx        on public.app_teams (company_id);

-- ------------------------------------------------------------ seed: 1 empresa por frente
insert into public.app_companies (name, slug, frente_slug, position) values
  ('Criptoforja / D-Sec', 'criptoforja-d-sec',  'criptoforja',          10),
  ('Grupo Today',         'grupo-today',         'grupo_today_os',       20),
  ('Emerge',              'emerge',              'emerge_financeiro',    30),
  ('Emerge — Propostas',  'emerge-propostas',    'emerge_propostas_dev', 40),
  ('Emerge Eventos',      'emerge-eventos',      'eventos',              50)
on conflict (slug) do nothing;

-- ------------------------------------------------------------ RLS
-- 7 tabelas do grafo: SELECT liberado p/ autenticado (o grafo renderiza pra todo
-- mundo logado) · ALL gated em equipe.manage_roles (já existe em app_permissions,
-- pos 82 — não seeda). app_user_prefs: só a própria linha.
do $$
declare
  t text;
begin
  foreach t in array array[
    'app_companies', 'app_teams', 'app_team_members', 'app_company_members',
    'app_team_roles', 'app_company_roles', 'app_company_clients'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = 'equipe org view'
    ) then
      execute format(
        'create policy %I on public.%I for select to authenticated using (true)',
        'equipe org view', t
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = 'equipe org manage'
    ) then
      execute format(
        'create policy %I on public.%I for all to authenticated using (app_has_permission(auth.uid(), %L)) with check (app_has_permission(auth.uid(), %L))',
        'equipe org manage', t, 'equipe.manage_roles', 'equipe.manage_roles'
      );
    end if;
  end loop;
end $$;

do $$
begin
  execute 'alter table public.app_user_prefs enable row level security';

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'app_user_prefs'
      and policyname = 'user prefs own select'
  ) then
    execute format(
      'create policy %I on public.app_user_prefs for select to authenticated using (user_id = auth.uid())',
      'user prefs own select'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'app_user_prefs'
      and policyname = 'user prefs own all'
  ) then
    execute format(
      'create policy %I on public.app_user_prefs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      'user prefs own all'
    );
  end if;
end $$;
