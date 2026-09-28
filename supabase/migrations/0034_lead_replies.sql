-- ============================================================
-- Retornos de leads: registra cada resposta REAL de um lead ao
-- outreach (não bounce/newsletter/auto-reply sem decisão humana),
-- classificada por sentimento, ligada ao lead — aparece direto no
-- card/sheet do lead em /pipeline, não em /tarefas. Escrito pela
-- rotina cloud "Resumo de retornos" (a cada 2 dias) via service role.
-- Aditivo. Não mexe em vendas_leads/outreach_messages.
-- ============================================================

create table if not exists public.lead_replies (
  id                   uuid primary key default gen_random_uuid(),
  lead_id              bigint not null references public.vendas_leads(id) on delete cascade,
  outreach_message_id  uuid references public.outreach_messages(id) on delete set null,
  gmail_thread_id      text,
  from_email           text,
  received_at          timestamptz not null default now(),
  classificacao        text not null
                          check (classificacao in ('positivo', 'negativo', 'neutro_com_prazo', 'auto_reply')),
  resumo               text not null,
  prazo_data           date,
  created_at           timestamptz not null default now()
);

create index if not exists lead_replies_lead_idx on public.lead_replies(lead_id);
create index if not exists lead_replies_received_idx on public.lead_replies(received_at desc);

alter table public.lead_replies enable row level security;

create policy "app pipeline view lead_replies" on public.lead_replies
  for select to authenticated
  using (app_has_permission(auth.uid(), 'pipeline.view'));

create policy "app pipeline manage lead_replies" on public.lead_replies
  for all to authenticated
  using (app_has_permission(auth.uid(), 'pipeline.manage'))
  with check (app_has_permission(auth.uid(), 'pipeline.manage'));
