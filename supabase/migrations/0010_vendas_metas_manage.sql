-- ============================================================
-- Central Emerge — 0010: editor de metas (vendas_metas)
--
-- A 0005 só deu SELECT (financeiro.view) em vendas_metas. Pra o editor
-- de metas por frente/período, quem tem financeiro.manage precisa
-- escrever. Permissivo, mesmo padrão dos bridges anteriores.
--
-- vendas_metas já tem UNIQUE(periodo, frente) → o app faz upsert nessa
-- chave. Nenhuma coluna nova. Aditivo. Idempotente.
-- ============================================================

drop policy if exists "app financeiro manage vendas_metas" on public.vendas_metas;
create policy "app financeiro manage vendas_metas" on public.vendas_metas
  for all to authenticated
  using (public.app_has_permission(auth.uid(), 'financeiro.manage'))
  with check (public.app_has_permission(auth.uid(), 'financeiro.manage'));
