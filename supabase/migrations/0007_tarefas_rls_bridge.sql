-- ============================================================
-- Central Emerge — 0007: Tarefas (/tarefas board real sobre `tasks`)
--
-- Só bridges de RLS. Nenhuma coluna nova, nenhuma tabela nova.
--
-- `tasks` hoje: SELECT/UPDATE/DELETE só p/ created_by | assigned_to |
-- admin. `task_assignees`: SELECT/DELETE só admin-ou-relacionado. Um
-- membro com `tarefas.view` que não é dono/assignee não enxerga o board.
--
-- Adiciona (permissivo, OR com as antigas):
--   tasks           SELECT p/ tarefas.view   + ALL p/ tarefas.manage
--   task_assignees  SELECT p/ tarefas.view   + ALL p/ tarefas.manage
--   task_statuses   ALL   p/ tarefas.manage   (SELECT já é aberto)
--
-- Colunas do board = o CHECK que já existe em tasks.status:
--   pending · in_progress · completed · cancelled
-- (A tabela task_statuses existe com 4 linhas de config, mas NÃO está
--  ligada a tasks — sem FK. Usar essa config exigiria migração de dados
--  = Bloco 2. Não mexi.)
--
-- Aditivo. Idempotente.
-- ============================================================

drop policy if exists "app tarefas view tasks" on public.tasks;
create policy "app tarefas view tasks" on public.tasks
  for select to authenticated
  using (public.app_has_permission(auth.uid(), 'tarefas.view'));

drop policy if exists "app tarefas manage tasks" on public.tasks;
create policy "app tarefas manage tasks" on public.tasks
  for all to authenticated
  using (public.app_has_permission(auth.uid(), 'tarefas.manage'))
  with check (public.app_has_permission(auth.uid(), 'tarefas.manage'));

drop policy if exists "app tarefas view task_assignees" on public.task_assignees;
create policy "app tarefas view task_assignees" on public.task_assignees
  for select to authenticated
  using (public.app_has_permission(auth.uid(), 'tarefas.view'));

drop policy if exists "app tarefas manage task_assignees" on public.task_assignees;
create policy "app tarefas manage task_assignees" on public.task_assignees
  for all to authenticated
  using (public.app_has_permission(auth.uid(), 'tarefas.manage'))
  with check (public.app_has_permission(auth.uid(), 'tarefas.manage'));

drop policy if exists "app tarefas manage task_statuses" on public.task_statuses;
create policy "app tarefas manage task_statuses" on public.task_statuses
  for all to authenticated
  using (public.app_has_permission(auth.uid(), 'tarefas.manage'))
  with check (public.app_has_permission(auth.uid(), 'tarefas.manage'));
