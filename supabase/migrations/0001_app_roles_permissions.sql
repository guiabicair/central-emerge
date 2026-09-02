-- ============================================================
-- Central Emerge — Fase 5: papéis e permissões geridos pelo admin
-- Tabelas novas com prefixo app_ (não colidem com o schema Lovable).
-- Aditivo: nada nas tabelas existentes é tocado.
-- ============================================================

-- 1. Catálogo de permissões (semeado aqui; a UI lista daqui) --------------
create table if not exists public.app_permissions (
  key         text primary key,
  label       text not null,
  area        text not null,
  description text,
  position    int  not null default 0
);

-- 2. Papéis (criados/editados pelo admin) --------------------------------
create table if not exists public.app_roles (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  color       text,
  is_system   boolean not null default false,
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3. Permissões de cada papel -----------------------------------------
create table if not exists public.app_role_permissions (
  role_id        uuid not null references public.app_roles(id) on delete cascade,
  permission_key text not null references public.app_permissions(key) on delete cascade,
  primary key (role_id, permission_key)
);

-- 4. Papéis de cada usuário (N:N) -----------------------------------
create table if not exists public.app_user_roles (
  user_id     uuid not null references auth.users(id) on delete cascade,
  role_id     uuid not null references public.app_roles(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create index if not exists app_user_roles_user_idx on public.app_user_roles(user_id);

-- 5. Helpers (security definer -> ignoram RLS internamente) ------------
create or replace function public.app_is_admin(uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.app_user_roles ur
    join public.app_roles r on r.id = ur.role_id
    where ur.user_id = uid and r.slug = 'admin'
  );
$$;

create or replace function public.app_has_permission(uid uuid, perm text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.app_is_admin(uid) or exists (
    select 1
    from public.app_user_roles ur
    join public.app_role_permissions rp on rp.role_id = ur.role_id
    where ur.user_id = uid and rp.permission_key = perm
  );
$$;

-- 6. RLS ------------------------------------------------------------
alter table public.app_permissions      enable row level security;
alter table public.app_roles            enable row level security;
alter table public.app_role_permissions enable row level security;
alter table public.app_user_roles       enable row level security;

drop policy if exists "perm read"  on public.app_permissions;
create policy "perm read" on public.app_permissions
  for select to authenticated using (true);

drop policy if exists "roles read"  on public.app_roles;
drop policy if exists "roles write" on public.app_roles;
create policy "roles read"  on public.app_roles for select to authenticated using (true);
create policy "roles write" on public.app_roles for all to authenticated
  using (public.app_is_admin(auth.uid())) with check (public.app_is_admin(auth.uid()));

drop policy if exists "rp read"  on public.app_role_permissions;
drop policy if exists "rp write" on public.app_role_permissions;
create policy "rp read"  on public.app_role_permissions for select to authenticated using (true);
create policy "rp write" on public.app_role_permissions for all to authenticated
  using (public.app_is_admin(auth.uid())) with check (public.app_is_admin(auth.uid()));

drop policy if exists "ur read"  on public.app_user_roles;
drop policy if exists "ur write" on public.app_user_roles;
create policy "ur read"  on public.app_user_roles for select to authenticated using (true);
create policy "ur write" on public.app_user_roles for all to authenticated
  using (public.app_is_admin(auth.uid())) with check (public.app_is_admin(auth.uid()));

-- 7. Semente do catálogo de permissões -------------------------------
insert into public.app_permissions (key, label, area, position) values
  ('pipeline.view',            'Ver pipeline',                  'Pipeline',   10),
  ('pipeline.manage',          'Gerir leads e estágios',        'Pipeline',   11),
  ('propostas.view',           'Ver propostas',                 'Propostas',  20),
  ('propostas.manage',         'Criar e administrar propostas', 'Propostas',  21),
  ('clientes.view',            'Ver clientes',                  'Clientes',   30),
  ('clientes.manage',          'Gerir clientes e contratos',    'Clientes',   31),
  ('tarefas.view',             'Ver tarefas',                   'Tarefas',    40),
  ('tarefas.manage',           'Gerir tarefas e entregas',      'Tarefas',    41),
  ('financeiro.view',          'Ver financeiro',                'Financeiro', 50),
  ('financeiro.manage',        'Lançar e editar financeiro',    'Financeiro', 51),
  ('calendario.view',          'Ver calendário',                'Calendário', 60),
  ('calendario.manage',        'Gerir eventos',                 'Calendário', 61),
  ('social.view',              'Ver calendário social',         'Social',     70),
  ('social.manage',            'Criar e editar posts',          'Social',     71),
  ('social.approve',           'Aprovar posts',                 'Social',     72),
  ('equipe.view',              'Ver equipe',                    'Equipe',     80),
  ('equipe.approve_users',     'Aprovar usuários',              'Equipe',     81),
  ('equipe.manage_roles',      'Gerir papéis e permissões',     'Equipe',     82),
  ('equipe.manage_freelancers','Gerir freelancers',             'Equipe',     83),
  ('recursos.view',            'Ver recursos (acessos, cursos)','Recursos',   90),
  ('recursos.manage',          'Gerir recursos',                'Recursos',   91),
  ('afiliados.view',           'Ver afiliados',                 'Afiliados',  100),
  ('afiliados.manage',         'Gerir programa de afiliados',   'Afiliados',  101),
  ('labs.view',                'Ver Emerge Labs',               'Labs',       110),
  ('labs.manage',              'Gerir produtos do Labs',        'Labs',       111),
  ('automacoes.view',          'Ver automações',                'Automações', 120),
  ('automacoes.manage',        'Criar e editar automações',     'Automações', 121),
  ('config.manage',            'Configurações do sistema',      'Config',     130)
on conflict (key) do nothing;

-- 8. Semente de papéis --------------------------------------------
insert into public.app_roles (slug, name, description, color, is_system, position) values
  ('admin',      'Administrador', 'Acesso total ao sistema.',                       '#45f0d1', true,  0),
  ('socio',      'Sócio',         'Visão e gestão do negócio, sem mexer em papéis.','#93a6ff', false, 1),
  ('producao',   'Produção',      'Time de execução — tarefas, conteúdo, agenda.',  '#c9ff3f', false, 2),
  ('freelancer', 'Freelancer',    'Acesso pontual a tarefas e recursos.',           '#ff8f6b', false, 3),
  ('afiliado',   'Afiliado',      'Programa de indicação.',                          '#fbbf24', false, 4)
on conflict (slug) do nothing;

-- 9. Permissões por papel ---------------------------------------
-- admin: tudo
insert into public.app_role_permissions (role_id, permission_key)
select r.id, pm.key from public.app_roles r cross join public.app_permissions pm
where r.slug = 'admin'
on conflict do nothing;

-- socio: tudo menos gerir papéis e config
insert into public.app_role_permissions (role_id, permission_key)
select r.id, pm.key from public.app_roles r cross join public.app_permissions pm
where r.slug = 'socio' and pm.key not in ('equipe.manage_roles','config.manage')
on conflict do nothing;

-- producao
insert into public.app_role_permissions (role_id, permission_key)
select r.id, k from public.app_roles r
cross join (values
  ('pipeline.view'),('propostas.view'),('clientes.view'),
  ('tarefas.view'),('tarefas.manage'),
  ('calendario.view'),('calendario.manage'),
  ('social.view'),('social.manage'),
  ('recursos.view'),('equipe.view'),('automacoes.view')
) as p(k)
where r.slug = 'producao'
on conflict do nothing;

-- freelancer
insert into public.app_role_permissions (role_id, permission_key)
select r.id, k from public.app_roles r
cross join (values ('tarefas.view'),('calendario.view'),('recursos.view')) as p(k)
where r.slug = 'freelancer'
on conflict do nothing;

-- afiliado
insert into public.app_role_permissions (role_id, permission_key)
select r.id, k from public.app_roles r
cross join (values ('afiliados.view')) as p(k)
where r.slug = 'afiliado'
on conflict do nothing;

-- 10. Migra os usuários aprovados de profiles.role -> app_user_roles ----
insert into public.app_user_roles (user_id, role_id)
select p.user_id, r.id
from public.profiles p
join public.app_roles r on r.slug = case p.role
  when 'admin'     then 'admin'
  when 'socio'     then 'socio'
  when 'employee'  then 'producao'
  when 'freelancer' then 'freelancer'
  when 'affiliate' then 'afiliado'
  else 'producao'
end
where p.approval_status = 'approved'
on conflict do nothing;

-- garante o admin bootstrap (contato.emergetech@gmail.com)
insert into public.app_user_roles (user_id, role_id)
select 'e6c18808-721e-48ec-ae87-642d72ba4362', id from public.app_roles where slug = 'admin'
on conflict do nothing;

-- 11. Política aditiva: quem aprova usuários pode editar profiles de terceiros ----
drop policy if exists "app admins manage profiles" on public.profiles;
create policy "app admins manage profiles" on public.profiles for update to authenticated
  using (public.app_is_admin(auth.uid()) or public.app_has_permission(auth.uid(),'equipe.approve_users'))
  with check (public.app_is_admin(auth.uid()) or public.app_has_permission(auth.uid(),'equipe.approve_users'));

-- 12. Lista de membros com e-mail (auth.users) — só p/ quem tem equipe.view ----
create or replace function public.app_team_members()
returns table (
  user_id uuid, email text, full_name text, avatar_url text,
  approval_status text, requested_role text, mood text,
  created_at timestamptz, roles text[]
)
language sql stable security definer set search_path = '' as $$
  select p.user_id, u.email::text, p.full_name, p.avatar_url,
         p.approval_status, p.requested_role, p.mood, p.created_at,
         coalesce(array_agg(r.slug order by r.position) filter (where r.slug is not null), '{}') as roles
  from public.profiles p
  join auth.users u on u.id = p.user_id
  left join public.app_user_roles ur on ur.user_id = p.user_id
  left join public.app_roles r on r.id = ur.role_id
  where public.app_has_permission(auth.uid(), 'equipe.view')
  group by p.user_id, u.email, p.full_name, p.avatar_url,
           p.approval_status, p.requested_role, p.mood, p.created_at;
$$;
revoke all on function public.app_team_members() from anon;
grant execute on function public.app_team_members() to authenticated;
