-- EPIC Equipe / Organização — TREM 1B: cascata de permissão por TIME e EMPRESA.
-- app_has_permission passa a considerar, ALÉM do papel direto do usuário
-- (app_user_roles), os papéis herdados por ser membro de um TIME (app_team_roles)
-- e por estar numa EMPRESA (app_company_roles — direto em app_company_members OU
-- por estar num time daquela empresa).
--
-- SÓ `OR` ADITIVO — o fast-path atual (admin + papel direto) vem PRIMEIRO e
-- inalterado, então ninguém perde acesso (superset garantido).
-- SEM recursão: app_companies.parent_id NÃO entra (papel de holding não desce).
-- SEM tocar RLS: a função já é SECURITY DEFINER e bypassa a RLS das junctions
-- que lê; nenhuma policy nova, nenhum ALTER em policy.
-- SECURITY DEFINER + STABLE + `set search_path to ''` preservados idênticos ao atual
-- (todas as refs schema-qualificadas). LANGUAGE sql, como o original.
-- Usa os índices reversos criados na 0018. ACK Régie (EPIC Equipe/Org, Trem 1B).
--
-- ------------------------------------------------------------------
-- CORPO ANTIGO (referência — o que estava no banco antes desta migration):
--
--   CREATE OR REPLACE FUNCTION public.app_has_permission(uid uuid, perm text)
--    RETURNS boolean
--    LANGUAGE sql
--    STABLE SECURITY DEFINER
--    SET search_path TO ''
--   AS $function$
--     select public.app_is_admin(uid) or exists (
--       select 1
--       from public.app_user_roles ur
--       join public.app_role_permissions rp on rp.role_id = ur.role_id
--       where ur.user_id = uid and rp.permission_key = perm
--     );
--   $function$
-- ------------------------------------------------------------------

create or replace function public.app_has_permission(uid uuid, perm text)
  returns boolean
  language sql
  stable security definer
  set search_path to ''
as $function$
  -- (1) fast-path inalterado: admin, ou papel DIRETO do usuário concede a perm.
  select public.app_is_admin(uid)
    or exists (
      select 1
      from public.app_user_roles ur
      join public.app_role_permissions rp on rp.role_id = ur.role_id
      where ur.user_id = uid and rp.permission_key = perm
    )
    -- (2) cascata via TIME: usuário é membro de um time cujo papel concede a perm.
    or exists (
      select 1
      from public.app_team_members tm
      join public.app_team_roles tr on tr.team_id = tm.team_id
      join public.app_role_permissions rp on rp.role_id = tr.role_id
      where tm.user_id = uid and rp.permission_key = perm
    )
    -- (3) cascata via EMPRESA: papel de empresa concede a perm e o usuário está
    --     naquela empresa — diretamente (app_company_members) ou por estar num
    --     time dela (app_team_members -> app_teams.company_id). SEM parent_id.
    or exists (
      select 1
      from public.app_company_roles cr
      join public.app_role_permissions rp on rp.role_id = cr.role_id
      where rp.permission_key = perm
        and (
          exists (
            select 1
            from public.app_company_members cm
            where cm.user_id = uid and cm.company_id = cr.company_id
          )
          or exists (
            select 1
            from public.app_team_members tm2
            join public.app_teams t2 on t2.id = tm2.team_id
            where tm2.user_id = uid and t2.company_id = cr.company_id
          )
        )
    );
$function$;

-- ------------------------------------------------------------------
-- REVERSÃO (rodar só isto pra voltar ao comportamento anterior — descomenta):
--
-- create or replace function public.app_has_permission(uid uuid, perm text)
--   returns boolean
--   language sql
--   stable security definer
--   set search_path to ''
-- as $function$
--   select public.app_is_admin(uid) or exists (
--     select 1
--     from public.app_user_roles ur
--     join public.app_role_permissions rp on rp.role_id = ur.role_id
--     where ur.user_id = uid and rp.permission_key = perm
--   );
-- $function$;
-- ------------------------------------------------------------------
