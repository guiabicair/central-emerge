-- ============================================================================
-- QA — TREM 1B: cascata de permissão (0019_equipe_perm_cascade.sql)
-- NÃO é migration. Rode no SQL editor / execute_sql, na ordem indicada.
-- Objetivo: provar que a nova app_has_permission (a) adiciona os 3 caminhos
-- novos, (b) é SUPERSET da antiga (ninguém perde acesso), (c) não recursa,
-- (d) tem plano sadio.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- (b.1) BASELINE — RODAR *ANTES* de aplicar a 0019.
--       Snapshot da matriz efetiva de permissão de todo mundo.
-- ----------------------------------------------------------------------------
drop table if exists _perm_baseline;
create table _perm_baseline as
select u.id as uid, p.key as perm, public.app_has_permission(u.id, p.key) as allowed
from auth.users u
cross join public.app_permissions p;

select count(*) as baseline_rows,
       count(*) filter (where allowed) as baseline_allowed
from _perm_baseline;

-- >>> agora aplique a 0019 (create or replace function) e siga. <<<


-- ----------------------------------------------------------------------------
-- (b.2) DIFF — RODAR *DEPOIS* da 0019. Tem que voltar 0 linhas.
--       Qualquer (uid, perm) que era true antes e virou false = REGRESSÃO.
-- ----------------------------------------------------------------------------
select b.uid, b.perm
from _perm_baseline b
where b.allowed
  and not public.app_has_permission(b.uid, b.perm);
-- ESPERADO: 0 rows.

-- ganhos novos (informativo — quem passou a ter acesso pela cascata):
select b.perm, count(*) as novos_com_acesso
from _perm_baseline b
where not b.allowed
  and public.app_has_permission(b.uid, b.perm)
group by b.perm
order by 2 desc;

drop table _perm_baseline;


-- ----------------------------------------------------------------------------
-- (a) TESTE FUNCIONAL DOS 3 CAMINHOS — tudo em transação, ROLLBACK no fim.
--     Nada persiste. Usa um user real (o 1º de app_user_roles) e um papel real
--     (o 1º papel NÃO-admin que concede alguma perm), escolhendo uma perm que
--     esse user AINDA NÃO tem hoje.
-- ----------------------------------------------------------------------------
begin;

do $$
declare
  v_uid   uuid;
  v_role  uuid;
  v_perm  text;
  v_co    uuid;
  v_team  uuid;
  r_direct boolean;
  r_team   boolean;
  r_codir  boolean;
  r_coteam boolean;
  r_none   boolean;
begin
  -- user de teste: alguém que já usa o sistema
  select user_id into v_uid from public.app_user_roles limit 1;

  -- papel não-sistema que concede pelo menos 1 permissão
  select r.id into v_role
  from public.app_roles r
  join public.app_role_permissions rp on rp.role_id = r.id
  where r.is_system = false
  group by r.id
  order by count(*) desc
  limit 1;

  -- uma permissão que esse papel concede E que o user de teste NÃO tem hoje
  select rp.permission_key into v_perm
  from public.app_role_permissions rp
  where rp.role_id = v_role
    and not public.app_has_permission(v_uid, rp.permission_key)
  limit 1;

  if v_uid is null or v_role is null or v_perm is null then
    raise exception 'setup: não achei user/papel/perm de teste (uid=%, role=%, perm=%). Ajuste os picks.', v_uid, v_role, v_perm;
  end if;
  raise notice 'setup ok — uid=%  role=%  perm=%', v_uid, v_role, v_perm;

  -- estado zero: sem nenhum vínculo novo, a perm deve ser FALSE
  r_none := public.app_has_permission(v_uid, v_perm);
  raise notice 'antes de qualquer vínculo: % (esperado false)', r_none;

  -- empresa + time de teste
  insert into public.app_companies (name, slug) values ('QA 1B Co', 'qa-1b-co-' || substr(gen_random_uuid()::text,1,8))
    returning id into v_co;
  insert into public.app_teams (company_id, name) values (v_co, 'QA 1B Team')
    returning id into v_team;

  -- CAMINHO 1 — via TIME: user no time + papel no time
  insert into public.app_team_members (team_id, user_id) values (v_team, v_uid);
  insert into public.app_team_roles (team_id, role_id) values (v_team, v_role);
  r_team := public.app_has_permission(v_uid, v_perm);
  raise notice 'CAMINHO time (user+papel no time): % (esperado true)', r_team;
  delete from public.app_team_roles where team_id = v_team;

  -- CAMINHO 2 — via EMPRESA DIRETO: user em app_company_members + papel na empresa
  insert into public.app_company_members (company_id, user_id) values (v_co, v_uid);
  insert into public.app_company_roles (company_id, role_id) values (v_co, v_role);
  r_codir := public.app_has_permission(v_uid, v_perm);
  raise notice 'CAMINHO empresa-direto (company_members + company_roles): % (esperado true)', r_codir;
  delete from public.app_company_members where company_id = v_co;

  -- CAMINHO 3 — via TIME -> EMPRESA: user só no time (já está), papel na empresa
  r_coteam := public.app_has_permission(v_uid, v_perm);
  raise notice 'CAMINHO time->empresa (user no time da empresa + company_roles): % (esperado true)', r_coteam;

  -- tira tudo -> volta a FALSE
  delete from public.app_company_roles where company_id = v_co;
  delete from public.app_team_members where team_id = v_team;
  r_direct := public.app_has_permission(v_uid, v_perm);
  raise notice 'depois de remover todos os vínculos: % (esperado false)', r_direct;

  if not (r_none = false and r_team = true and r_codir = true and r_coteam = true and r_direct = false) then
    raise exception 'FALHOU: none=% team=% co_dir=% co_team=% final=%', r_none, r_team, r_codir, r_coteam, r_direct;
  end if;
  raise notice 'OK — os 3 caminhos concedem e a remoção revoga.';
end $$;

rollback;


-- ----------------------------------------------------------------------------
-- (c) SMOKE ANTI-RECURSÃO — depois da 0019. Nenhum "stack depth limit exceeded",
--     nenhuma query travando. As tabelas abaixo têm RLS gated em app_has_permission.
-- ----------------------------------------------------------------------------
select
  (select count(*) from public.clients)          as clients,
  (select count(*) from public.tasks)            as tasks,
  (select count(*) from public.vendas_leads)     as vendas_leads,
  (select count(*) from public.app_cronogramas)  as cronogramas,
  (select count(*) from public.social_posts)     as social_posts;
-- ESPERADO: 5 números, sem erro.


-- ----------------------------------------------------------------------------
-- (d) EXPLAIN — plano da função nova pra um usuário com vínculos.
--     Não pode ter seq scan gigante nas junctions; deve usar os índices reversos
--     da 0018 (app_team_members_user_idx, app_company_members_user_idx,
--     app_team_roles_role_idx, app_company_roles_role_idx, app_teams_company_idx).
-- ----------------------------------------------------------------------------
explain (analyze, buffers, verbose)
select public.app_has_permission(
  (select user_id from public.app_user_roles limit 1),
  'clientes.view'
);

-- inspeção manual das sub-consultas da cascata (mesma forma que a função usa):
explain (analyze)
select 1
from public.app_team_members tm
join public.app_team_roles tr on tr.team_id = tm.team_id
join public.app_role_permissions rp on rp.role_id = tr.role_id
where tm.user_id = (select user_id from public.app_user_roles limit 1)
  and rp.permission_key = 'clientes.view';

explain (analyze)
select 1
from public.app_company_roles cr
join public.app_role_permissions rp on rp.role_id = cr.role_id
where rp.permission_key = 'clientes.view'
  and (
    exists (select 1 from public.app_company_members cm
            where cm.user_id = (select user_id from public.app_user_roles limit 1)
              and cm.company_id = cr.company_id)
    or exists (select 1 from public.app_team_members tm2
               join public.app_teams t2 on t2.id = tm2.team_id
               where tm2.user_id = (select user_id from public.app_user_roles limit 1)
                 and t2.company_id = cr.company_id)
  );
