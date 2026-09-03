-- EPIC Tarefas 3a — campo Briefing em tasks + bridge de RLS pra subtasks.
-- Aditivo e idempotente. Não toca dados nem constraints existentes.

-- 1) Briefing: texto longo separado da descrição curta.
alter table public.tasks
  add column if not exists briefing text;

-- 2) subtasks — a tabela e suas policies antigas são da Central Lovable
--    (SELECT exige profile aprovado, DELETE só admin). A Central Emerge
--    governa por permissão: adiciona as duas policies-ponte, no mesmo
--    padrão de tasks/task_assignees (migration 0007).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'subtasks'
      and policyname = 'app tarefas view subtasks'
  ) then
    create policy "app tarefas view subtasks" on public.subtasks
      for select to authenticated
      using (app_has_permission(auth.uid(), 'tarefas.view'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'subtasks'
      and policyname = 'app tarefas manage subtasks'
  ) then
    create policy "app tarefas manage subtasks" on public.subtasks
      for all to authenticated
      using (app_has_permission(auth.uid(), 'tarefas.manage'))
      with check (app_has_permission(auth.uid(), 'tarefas.manage'));
  end if;
end $$;
