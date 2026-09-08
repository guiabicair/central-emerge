-- EPIC Equipe / Organização — TREM 2: papéis efetivos (read-only) + bucket de logo.
--
-- `app_effective_roles(uid)` — quais papéis o usuário TEM e DE ONDE vêm. Mesma
-- cascata da 0019 (`app_has_permission`), mas devolve LINHAS com a origem em vez de
-- um booleano — alimenta os badges de origem da aba "Organização" e (Trem 3) os nós.
-- Lógica num lugar só: `app_effective_roles_all()` faz o trabalho, a versão por uid
-- só filtra. Ambas SECURITY DEFINER + STABLE + search_path pinado, additive, sem RLS
-- nova (as policies da 0018 já cobrem as tabelas lidas).
--
-- Bucket `org` (logos de empresa/holding) — leitura pública, escrita gated em
-- `equipe.manage_roles` (mesma perm que a 0018 usa pra escrita do grafo). Path de
-- upload é aleatório (uuid) porque bucket read-público é enumerável.
--
-- ADITIVO + IDEMPOTENTE. ACK Régie (EPIC Equipe/Org, Trem 2).

create extension if not exists pgcrypto;

-- ------------------------------------------------------------ papéis efetivos (todos os usuários)
create or replace function public.app_effective_roles_all()
  returns table (user_id uuid, role_id uuid, role_name text, role_color text, source text)
  language sql
  stable security definer
  set search_path to ''
as $function$
  -- (1) papel DIRETO do usuário
  select ur.user_id, r.id, r.name, r.color, 'direto'::text as source
  from public.app_user_roles ur
  join public.app_roles r on r.id = ur.role_id

  union all

  -- (2) papel herdado de um TIME em que o usuário é membro
  select tm.user_id, r.id, r.name, r.color, 'time:' || t.name
  from public.app_team_members tm
  join public.app_teams t on t.id = tm.team_id
  join public.app_team_roles tr on tr.team_id = tm.team_id
  join public.app_roles r on r.id = tr.role_id

  union all

  -- (3) papel herdado de uma EMPRESA — usuário é membro direto (app_company_members)
  select cm.user_id, r.id, r.name, r.color, 'empresa:' || co.name
  from public.app_company_members cm
  join public.app_companies co on co.id = cm.company_id
  join public.app_company_roles cr on cr.company_id = cm.company_id
  join public.app_roles r on r.id = cr.role_id

  union all

  -- (4) papel herdado de uma EMPRESA — usuário chega pela via time -> empresa
  select tm.user_id, r.id, r.name, r.color, 'empresa:' || co.name
  from public.app_team_members tm
  join public.app_teams t on t.id = tm.team_id
  join public.app_companies co on co.id = t.company_id
  join public.app_company_roles cr on cr.company_id = t.company_id
  join public.app_roles r on r.id = cr.role_id;
$function$;

grant execute on function public.app_effective_roles_all() to authenticated;

-- ------------------------------------------------------------ papéis efetivos (um usuário) — a função nomeada do spec
create or replace function public.app_effective_roles(uid uuid)
  returns table (role_id uuid, role_name text, role_color text, source text)
  language sql
  stable security definer
  set search_path to ''
as $function$
  select role_id, role_name, role_color, source
  from public.app_effective_roles_all()
  where user_id = uid;
$function$;

grant execute on function public.app_effective_roles(uuid) to authenticated;

-- ------------------------------------------------------------ Storage bucket 'org' (logos)
insert into storage.buckets (id, name, public)
values ('org', 'org', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'org bucket read'
  ) then
    create policy "org bucket read" on storage.objects
      for select to public using (bucket_id = 'org');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'org bucket write'
  ) then
    create policy "org bucket write" on storage.objects
      for all to authenticated
      using (bucket_id = 'org' and app_has_permission(auth.uid(), 'equipe.manage_roles'))
      with check (bucket_id = 'org' and app_has_permission(auth.uid(), 'equipe.manage_roles'));
  end if;
end $$;

-- ------------------------------------------------------------ REVERSÃO (descomenta pra desfazer):
-- drop function if exists public.app_effective_roles(uuid);
-- drop function if exists public.app_effective_roles_all();
-- delete from storage.objects where bucket_id = 'org';
-- delete from storage.buckets where id = 'org';
-- drop policy if exists "org bucket read" on storage.objects;
-- drop policy if exists "org bucket write" on storage.objects;
