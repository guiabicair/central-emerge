-- EPIC Tarefas 3f — bridge de RLS pras 4 tabelas do Bloco 2.
-- As tabelas e as policies antigas são da Central Lovable. A Central
-- Emerge governa por permissão: adiciona view (tarefas.view) + manage
-- (tarefas.manage), mesmo padrão de tasks/subtasks. Aditivo, idempotente.
-- Sem coluna nova.

do $$
declare
  t text;
begin
  foreach t in array array[
    'task_deliveries', 'time_entries', 'task_templates', 'task_comments'
  ] loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t
        and policyname = 'app tarefas view ' || t
    ) then
      execute format(
        'create policy %I on public.%I for select to authenticated using (app_has_permission(auth.uid(), %L))',
        'app tarefas view ' || t, t, 'tarefas.view'
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t
        and policyname = 'app tarefas manage ' || t
    ) then
      execute format(
        'create policy %I on public.%I for all to authenticated using (app_has_permission(auth.uid(), %L)) with check (app_has_permission(auth.uid(), %L))',
        'app tarefas manage ' || t, t, 'tarefas.manage', 'tarefas.manage'
      );
    end if;
  end loop;
end $$;
