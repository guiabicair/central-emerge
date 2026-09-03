-- ============================================================
-- Central Emerge — 0006: Pipeline (/pipeline board real sobre vendas_leads)
--
--  (1) 2 campos que o board usa e a tabela não tem. Nullable / default →
--      o "Radar" (que popula vendas_leads) ignora.
--        valor_estimado  numeric  — valor estimado do lead
--        responsavel     text     — nome livre (a tabela já usa texto em
--                                   criado_por; não há FK p/ auth.users)
--
--  (2) RLS: vendas_leads está com RLS ON e ZERO policies → hoje nega tudo
--      p/ authenticated. Adiciona SELECT (pipeline.view) + ALL
--      (pipeline.manage). Mesmo padrão permissivo do 0005 (vendas_metas).
--
-- Estágios do board = o CHECK que já existe em vendas_leads.status:
--   novo · contatado · qualificado · descartado · virou_proposta
-- (não inventei estágio novo).
--
-- Aditivo. Idempotente.
-- ============================================================

alter table public.vendas_leads add column if not exists valor_estimado numeric not null default 0;
alter table public.vendas_leads add column if not exists responsavel     text;

drop policy if exists "app pipeline view vendas_leads" on public.vendas_leads;
create policy "app pipeline view vendas_leads" on public.vendas_leads
  for select to authenticated
  using (public.app_has_permission(auth.uid(), 'pipeline.view'));

drop policy if exists "app pipeline manage vendas_leads" on public.vendas_leads;
create policy "app pipeline manage vendas_leads" on public.vendas_leads
  for all to authenticated
  using (public.app_has_permission(auth.uid(), 'pipeline.manage'))
  with check (public.app_has_permission(auth.uid(), 'pipeline.manage'));
