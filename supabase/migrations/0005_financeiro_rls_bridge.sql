-- ============================================================
-- Central Emerge — 0005: Financeiro (RLS bridge p/ a /financeiro)
--
-- As tabelas financeiras hoje só liberam via get_user_role='admin'
-- (Lovable). Algumas nem têm policy de SELECT p/ authenticated, e
-- vendas_metas está com RLS ON e ZERO policies (nega tudo). Aqui:
--
--   company_cash   + SELECT p/ financeiro.view   + ALL p/ financeiro.manage
--   vendas_metas   + SELECT p/ financeiro.view
--   company_goals  + SELECT p/ financeiro.view   + ALL p/ financeiro.manage
--   expenses       + ALL   p/ financeiro.manage   (SELECT já é aberto)
--
-- Só policies PERMISSIVAS (OR com as antigas). Nenhuma coluna nova,
-- nenhuma tabela nova. company_cash já é um log append-only (id,
-- current_amount, description, updated_by, updated_at) — o "ajuste com
-- confirmação + log" insere uma linha nova, não precisa de tabela extra.
-- Aditivo. Idempotente.
-- ============================================================

-- company_cash -------------------------------------------------------
drop policy if exists "app financeiro view company_cash" on public.company_cash;
create policy "app financeiro view company_cash" on public.company_cash
  for select to authenticated
  using (public.app_has_permission(auth.uid(), 'financeiro.view'));

drop policy if exists "app financeiro manage company_cash" on public.company_cash;
create policy "app financeiro manage company_cash" on public.company_cash
  for all to authenticated
  using (public.app_has_permission(auth.uid(), 'financeiro.manage'))
  with check (public.app_has_permission(auth.uid(), 'financeiro.manage'));

-- vendas_metas -----------------------------------------------------
drop policy if exists "app financeiro view vendas_metas" on public.vendas_metas;
create policy "app financeiro view vendas_metas" on public.vendas_metas
  for select to authenticated
  using (public.app_has_permission(auth.uid(), 'financeiro.view'));

-- company_goals --------------------------------------------------
drop policy if exists "app financeiro view company_goals" on public.company_goals;
create policy "app financeiro view company_goals" on public.company_goals
  for select to authenticated
  using (public.app_has_permission(auth.uid(), 'financeiro.view'));

drop policy if exists "app financeiro manage company_goals" on public.company_goals;
create policy "app financeiro manage company_goals" on public.company_goals
  for all to authenticated
  using (public.app_has_permission(auth.uid(), 'financeiro.manage'))
  with check (public.app_has_permission(auth.uid(), 'financeiro.manage'));

-- expenses -----------------------------------------------------
drop policy if exists "app financeiro manage expenses" on public.expenses;
create policy "app financeiro manage expenses" on public.expenses
  for all to authenticated
  using (public.app_has_permission(auth.uid(), 'financeiro.manage'))
  with check (public.app_has_permission(auth.uid(), 'financeiro.manage'));
