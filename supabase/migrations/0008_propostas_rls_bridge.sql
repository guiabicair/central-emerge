-- ============================================================
-- Central Emerge — 0008: Propostas (fatia READ-ONLY da /propostas)
--
-- `propostas` e `propostas_events` estão com RLS ON e ZERO policies →
-- hoje negam tudo p/ authenticated. A /propostas só lê. Adiciona
-- SELECT permissivo p/ quem tem `propostas.view`.
--
-- NADA de write — o gerador (emerge-propostas.vercel.app) é o dono da
-- escrita (Bloco 3).
--
-- Aditivo. Idempotente.
-- ============================================================

drop policy if exists "app propostas view propostas" on public.propostas;
create policy "app propostas view propostas" on public.propostas
  for select to authenticated
  using (public.app_has_permission(auth.uid(), 'propostas.view'));

drop policy if exists "app propostas view propostas_events" on public.propostas_events;
create policy "app propostas view propostas_events" on public.propostas_events
  for select to authenticated
  using (public.app_has_permission(auth.uid(), 'propostas.view'));
