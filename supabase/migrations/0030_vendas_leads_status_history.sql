-- ============================================================
-- Histórico de estágio dos leads (vendas_leads_status_history).
--
-- O board/dashboard só enxergava o status ATUAL de cada lead — não dava
-- pra medir taxa de conversão por unidade ao longo do tempo (novo →
-- contatado → qualificado → proposta), só a foto de agora. Esta migration
-- passa a registrar toda mudança de status via trigger, pra série de
-- tempo poder ser construída a partir de hoje.
--
-- Importante: não há como reconstruir o passado — a série nasce agora.
-- O backfill abaixo grava só o estado atual de cada lead já existente
-- como ponto de partida (não é histórico real).
-- ============================================================

create table if not exists public.vendas_leads_status_history (
  id              bigint generated always as identity primary key,
  lead_id         bigint not null references public.vendas_leads(id) on delete cascade,
  unidade         text not null,
  status_anterior text,
  status_novo     text not null,
  changed_at      timestamptz not null default now()
);

create index if not exists vendas_leads_status_history_lead_idx
  on public.vendas_leads_status_history(lead_id);

create index if not exists vendas_leads_status_history_unidade_status_idx
  on public.vendas_leads_status_history(unidade, status_novo, changed_at);

alter table public.vendas_leads_status_history enable row level security;

drop policy if exists "app pipeline view vendas_leads_status_history" on public.vendas_leads_status_history;
create policy "app pipeline view vendas_leads_status_history"
  on public.vendas_leads_status_history
  for select to authenticated
  using (public.app_has_permission(auth.uid(), 'pipeline.view'));

-- SECURITY DEFINER: só o gatilho escreve nesta tabela, então não existe
-- policy de INSERT pra usuários — a função roda com o privilégio de quem
-- a definiu (bypassa RLS aqui dentro), igual outros gatilhos de auditoria.
create or replace function public.vendas_leads_log_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.vendas_leads_status_history (lead_id, unidade, status_anterior, status_novo, changed_at)
    values (new.id, new.unidade, null, new.status, coalesce(new.atualizado_em, now()));
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.vendas_leads_status_history (lead_id, unidade, status_anterior, status_novo, changed_at)
    values (new.id, new.unidade, old.status, new.status, now());
  end if;
  return new;
end;
$$;

drop trigger if exists vendas_leads_status_history_trg on public.vendas_leads;
create trigger vendas_leads_status_history_trg
  after insert or update on public.vendas_leads
  for each row execute function public.vendas_leads_log_status_change();

-- Backfill: snapshot de hoje pros leads que já existiam antes desta
-- migration (ponto de partida da série, não histórico retroativo).
insert into public.vendas_leads_status_history (lead_id, unidade, status_anterior, status_novo, changed_at)
select vl.id, vl.unidade, null, vl.status, coalesce(vl.atualizado_em, now())
from public.vendas_leads vl
where not exists (
  select 1 from public.vendas_leads_status_history h where h.lead_id = vl.id
);
