-- EPIC Tarefas 3b — task_statuses vira a fonte das colunas do Kanban.
-- tasks.status continua TEXT; o CHECK rígido sai; a validação passa a ser
-- contra task_statuses.name na camada de action. Aditivo/reversível,
-- idempotente. Opção A da nota (renomeia in place, preserva ids).

-- 1) derruba o CHECK rígido de tasks.status
alter table public.tasks drop constraint if exists tasks_status_check;

-- 2) renomeia as 4 linhas legadas da Lovable pros nomes canônicos, in place.
--    Pendent -> pending (default) | In_progress -> in_progress
--    Completas -> completed        | Alteração  -> revisao (coluna custom mantida)
update public.task_statuses set name='pending',     color='amber',  position=1, is_default=true,  updated_at=now() where name='Pendent';
update public.task_statuses set name='in_progress', color='blue',   position=2, is_default=false, updated_at=now() where name='In_progress';
update public.task_statuses set name='completed',   color='green',  position=3, is_default=false, updated_at=now() where name='Completas';
update public.task_statuses set name='revisao',     color='violet', position=4, is_default=false, updated_at=now() where name='Alteração';

-- 3) garante a coluna 'cancelled' (o board atual tem "Cancelada"; sem linha
--    ela sumiria). Nenhuma task usa hoje, mas preserva a capacidade.
insert into public.task_statuses (name, color, position, is_default)
select 'cancelled', 'slate', 5, false
where not exists (select 1 from public.task_statuses where name = 'cancelled');

-- 4) exatamente um is_default (em 'pending')
update public.task_statuses set is_default = (name = 'pending');

-- 5) rede de segurança: task com status órfão cai no default
update public.tasks
   set status = 'pending', updated_at = now()
 where status is null
    or status not in (select name from public.task_statuses);

-- 6) bridge de RLS pra task_statuses (as policies atuais são da Lovable)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='task_statuses'
      and policyname='app tarefas view task_statuses'
  ) then
    create policy "app tarefas view task_statuses" on public.task_statuses
      for select to authenticated
      using (app_has_permission(auth.uid(), 'tarefas.view'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='task_statuses'
      and policyname='app tarefas manage task_statuses'
  ) then
    create policy "app tarefas manage task_statuses" on public.task_statuses
      for all to authenticated
      using (app_has_permission(auth.uid(), 'tarefas.manage'))
      with check (app_has_permission(auth.uid(), 'tarefas.manage'));
  end if;
end $$;
