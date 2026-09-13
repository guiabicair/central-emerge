-- ============================================================
-- Outreach de leads: agente gera rascunho de mensagem por lead,
-- Guilherme aprova/rejeita/edita dentro da Central, aprovado é
-- enviado via Gmail (contato.emergetech@gmail.com) por uma rotina
-- cloud separada. Aditivo. Não mexe em vendas_leads/lead_statuses.
-- ============================================================

create table if not exists public.outreach_messages (
  id             uuid primary key default gen_random_uuid(),
  lead_id        bigint not null references public.vendas_leads(id) on delete cascade,
  to_email       text not null,
  subject        text not null,
  body           text not null,
  status         text not null default 'draft'
                   check (status in ('draft', 'approved', 'rejected', 'sent', 'failed')),
  error          text,
  created_by_agent text,
  approved_by    uuid references auth.users(id),
  approved_at    timestamptz,
  sent_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- um rascunho ativo por lead (evita o agente gerar duplicado a cada rodada)
create unique index if not exists outreach_messages_lead_uidx
  on public.outreach_messages(lead_id)
  where status in ('draft', 'approved');

create index if not exists outreach_messages_status_idx
  on public.outreach_messages(status);

alter table public.outreach_messages enable row level security;

-- reaproveita as permissões do pipeline (outreach é parte do funil de vendas)
create policy "app pipeline view outreach_messages" on public.outreach_messages
  for select to authenticated
  using (app_has_permission(auth.uid(), 'pipeline.view'));

create policy "app pipeline manage outreach_messages" on public.outreach_messages
  for all to authenticated
  using (app_has_permission(auth.uid(), 'pipeline.manage'))
  with check (app_has_permission(auth.uid(), 'pipeline.manage'));
