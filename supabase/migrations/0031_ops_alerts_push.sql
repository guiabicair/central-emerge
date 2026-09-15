-- ============================================================
-- Central Emerge — 0031: Alerta ativo quando uma rotina quebra ou o Gmail
-- desconecta (task 1793fd40, revisão de melhorias de 13/09/2026).
--
-- Hoje uma falha de rotina automática (Outreach, Captação, etc.) só fica
-- registrada em texto livre na description da "task viva" do agente
-- (ops_agent_upsert_task) — só se descobre entrando na task. E o sinal
-- estruturado que já existe pra isso (ops_agent_activity.event_type =
-- 'blocked', ver docs/ops-agentes.md) nunca é lido em lugar nenhum.
--
-- Este migration cria uma trilha de alertas real (sem dado inventado):
--   1. ops_alerts — log de alertas, alimentado só por 2 sinais que já
--      existem e já são usados neste banco:
--        a) public.tasks: agent_name preenchido + status vira 'blocked'
--           (já usado hoje, ex: task "Painel de saúde dos agentes");
--        b) public.ops_agent_activity: event_type = 'blocked' (já é uma
--           opção válida no CHECK da 0022, só nunca foi consumida).
--   2. push_subscriptions — inscrições Web Push por usuário (chave VAPID
--      própria, sem depender de provedor de e-mail pago).
--   3. RPCs SECURITY DEFINER (mesmo padrão anon da 0022/0023) pra um
--      endpoint da própria Central (sem sessão de usuário) buscar
--      inscrições e alertas pendentes e despachar a notificação.
--   4. pg_cron + pg_net (ambos já habilitados neste projeto Supabase)
--      chamando esse endpoint a cada 5 min — sem depender do plano de
--      Cron Jobs da Vercel.
--
-- Aditivo. Nenhuma tabela/coluna existente é alterada além de novos
-- triggers em cima de tasks/ops_agent_activity.
-- ============================================================

-- 1. Alertas -----------------------------------------------------------
create table if not exists public.ops_alerts (
  id                uuid primary key default gen_random_uuid(),
  kind              text not null,
  source_agent_name text,
  task_id           uuid references public.tasks(id) on delete set null,
  ops_activity_id   uuid references public.ops_agent_activity(id) on delete set null,
  title             text not null,
  message           text,
  resolved          boolean not null default false,
  resolved_at       timestamptz,
  dispatched_at     timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists ops_alerts_pending_idx on public.ops_alerts (created_at) where dispatched_at is null;
create index if not exists ops_alerts_unresolved_idx on public.ops_alerts (created_at desc) where resolved = false;

alter table public.ops_alerts enable row level security;

create policy ops_alerts_select on public.ops_alerts
  for select to authenticated
  using (public.app_has_permission(auth.uid(), 'ops.view'));

create policy ops_alerts_update on public.ops_alerts
  for update to authenticated
  using (public.app_has_permission(auth.uid(), 'ops.manage'))
  with check (public.app_has_permission(auth.uid(), 'ops.manage'));

-- 2. Inscrições Web Push -------------------------------------------------
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth_key   text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

create policy push_subscriptions_own on public.push_subscriptions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Triggers — os 2 sinais reais de falha ------------------------------
create or replace function public.ops_alerts_on_task_blocked()
returns trigger
language plpgsql
security definer
set search_path = ''
as $func$
begin
  insert into public.ops_alerts (kind, source_agent_name, task_id, title, message)
  values (
    'task_blocked',
    new.agent_name,
    new.id,
    format('Tarefa bloqueada: %s', new.title),
    left(new.description, 500)
  );
  return new;
end;
$func$;

drop trigger if exists ops_alerts_on_task_blocked_trg on public.tasks;
create trigger ops_alerts_on_task_blocked_trg
  after update on public.tasks
  for each row
  when (new.agent_name is not null and new.status = 'blocked' and old.status is distinct from new.status)
  execute function public.ops_alerts_on_task_blocked();

create or replace function public.ops_alerts_on_activity_blocked()
returns trigger
language plpgsql
security definer
set search_path = ''
as $func$
begin
  insert into public.ops_alerts (kind, source_agent_name, ops_activity_id, title, message)
  values (
    'activity_blocked',
    new.agent_name,
    new.id,
    format('%s reportou um bloqueio', new.agent_name),
    coalesce(new.detail, new.summary)
  );
  return new;
end;
$func$;

drop trigger if exists ops_alerts_on_activity_blocked_trg on public.ops_agent_activity;
create trigger ops_alerts_on_activity_blocked_trg
  after insert on public.ops_agent_activity
  for each row
  when (new.event_type = 'blocked')
  execute function public.ops_alerts_on_activity_blocked();

-- 4. RPCs pro endpoint de despacho (sem sessão de usuário, mesmo padrão
--    anon das RPCs de agente da 0022/0023) ------------------------------
create or replace function public.ops_alerts_claim_pending(p_limit int default 50)
returns setof public.ops_alerts
language plpgsql
security definer
set search_path = ''
as $func$
begin
  return query
    update public.ops_alerts
    set dispatched_at = now()
    where id in (
      select id from public.ops_alerts
      where dispatched_at is null
      order by created_at
      limit greatest(1, least(coalesce(p_limit, 50), 200))
    )
    returning *;
end;
$func$;

create or replace function public.ops_push_subscriptions_list()
returns setof public.push_subscriptions
language sql
security definer
set search_path = ''
as $func$
  select * from public.push_subscriptions;
$func$;

create or replace function public.ops_push_subscription_remove(p_endpoint text)
returns void
language sql
security definer
set search_path = ''
as $func$
  delete from public.push_subscriptions where endpoint = p_endpoint;
$func$;

grant execute on function public.ops_alerts_claim_pending(int) to anon, authenticated;
grant execute on function public.ops_push_subscriptions_list() to anon, authenticated;
grant execute on function public.ops_push_subscription_remove(text) to anon, authenticated;

-- 5. pg_cron + pg_net — despacha a cada 5 min ----------------------------
-- O segredo é gerado em runtime e guardado só em private.app_secrets (não
-- em texto neste arquivo/git) — só sai daqui via execute_sql avulso pra
-- virar env var CRON_ALERTS_SECRET na Vercel.
create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table if not exists private.app_secrets (
  key        text primary key,
  value      text not null,
  created_at timestamptz not null default now()
);
revoke all on private.app_secrets from anon, authenticated;

do $$
declare
  v_secret text;
begin
  select value into v_secret from private.app_secrets where key = 'ops_alerts_cron_secret';
  if v_secret is null then
    v_secret := encode(extensions.gen_random_bytes(24), 'hex');
    insert into private.app_secrets (key, value) values ('ops_alerts_cron_secret', v_secret);
  end if;

  perform cron.unschedule(jobid) from cron.job where jobname = 'ops-alerts-dispatch';

  perform cron.schedule(
    'ops-alerts-dispatch',
    '*/5 * * * *',
    format(
      $cmd$select net.http_post(
        url := 'https://central-emerge.vercel.app/api/cron/dispatch-alerts',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', %L),
        body := '{}'::jsonb
      );$cmd$,
      v_secret
    )
  );
end;
$$;
