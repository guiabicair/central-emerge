-- ============================================================
-- Pipeline ganha colunas editáveis (renomear/reordenar/cor), mesmo
-- padrão de task_statuses (migration 0012). vendas_leads.status
-- continua text livre, validado contra lead_statuses.name na action.
-- ============================================================

create table if not exists public.lead_statuses (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  color      text not null default 'blue',
  position   int not null default 0,
  is_default boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.lead_statuses (name, color, position, is_default) values
  ('novo',               'blue',   1, true),
  ('contatado',          'teal',   2, false),
  ('qualificado',        'green',  3, false),
  ('virou_proposta',     'violet', 4, false),
  ('proposta_aprovada',  'green',  5, false),
  ('descartado',         'slate',  6, false)
on conflict (name) do nothing;

-- rede de segurança: lead com status órfão cai no default
update public.vendas_leads
   set status = 'novo', atualizado_em = now()
 where status is null
    or status not in (select name from public.lead_statuses);

alter table public.lead_statuses enable row level security;

create policy "app pipeline view lead_statuses" on public.lead_statuses
  for select to authenticated
  using (app_has_permission(auth.uid(), 'pipeline.view'));

create policy "app pipeline manage lead_statuses" on public.lead_statuses
  for all to authenticated
  using (app_has_permission(auth.uid(), 'pipeline.manage'))
  with check (app_has_permission(auth.uid(), 'pipeline.manage'));
