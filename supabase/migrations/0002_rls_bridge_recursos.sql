-- ============================================================
-- Central Emerge — 0002: pontes de RLS
-- As tabelas do schema Lovable (platform_access, courses, ...) só
-- deixam escrever se profiles.role = 'admin' (função antiga
-- get_user_role). Aqui adicionamos políticas PERMISSIVAS que também
-- aceitam a permissão nova `recursos.manage` do sistema de papéis.
-- Aditivo: as políticas antigas continuam valendo (OR).
-- Idempotente.
-- ============================================================

drop policy if exists "app recursos manage platform_access" on public.platform_access;
create policy "app recursos manage platform_access" on public.platform_access
  for all to authenticated
  using (public.app_has_permission(auth.uid(), 'recursos.manage'))
  with check (public.app_has_permission(auth.uid(), 'recursos.manage'));

drop policy if exists "app recursos manage courses" on public.courses;
create policy "app recursos manage courses" on public.courses
  for all to authenticated
  using (public.app_has_permission(auth.uid(), 'recursos.manage'))
  with check (public.app_has_permission(auth.uid(), 'recursos.manage'));
