-- ============================================================
-- ops_projects ganha um cliente padrão — tasks de agente passam a
-- vir vinculadas ao cliente certo automaticamente (achado do Guilherme
-- em 12/09: tasks do Claude Code apareciam "sem cliente" quando na
-- verdade são do Emerge Labs).
-- ============================================================

alter table public.ops_projects add column if not exists default_client_id
  uuid references public.clients(id) on delete set null;

update public.ops_projects set default_client_id = (
  select id from public.clients where name = 'Emerge Labs' limit 1
)
where slug = 'central-emerge';

create or replace function public.ops_agent_upsert_task(
  p_project_slug text,
  p_agent_name text,
  p_title text default null,
  p_task_id uuid default null,
  p_status text default null,
  p_priority text default null,
  p_description text default null,
  p_link text default null,
  p_due_date date default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $func$
declare
  v_project_id uuid;
  v_client_id uuid;
  v_status text;
  v_priority text;
  v_id uuid;
begin
  if p_agent_name is null or trim(p_agent_name) = '' then
    raise exception 'agent_name é obrigatório';
  end if;

  v_project_id := public.ops_ensure_project(p_project_slug, null);
  select default_client_id into v_client_id from public.ops_projects where id = v_project_id;
  v_priority := case when p_priority in ('low', 'medium', 'high', 'urgent') then p_priority else null end;

  if p_task_id is not null then
    update public.tasks set
      title          = coalesce(nullif(trim(p_title), ''), title),
      description    = coalesce(nullif(trim(p_description), ''), description),
      status         = coalesce((select name from public.task_statuses where name = p_status), status),
      priority       = coalesce(v_priority, priority),
      drive_link     = coalesce(nullif(trim(p_link), ''), drive_link),
      due_date       = coalesce(p_due_date, due_date),
      agent_name     = trim(p_agent_name),
      ops_project_id = v_project_id,
      client_id      = coalesce(client_id, v_client_id),
      updated_at     = now()
    where id = p_task_id
      and ops_project_id = v_project_id
    returning id into v_id;

    if v_id is null then
      raise exception 'tarefa não encontrada (ou não pertence a este projeto)';
    end if;
  else
    if p_title is null or trim(p_title) = '' then
      raise exception 'title é obrigatório para criar uma tarefa nova';
    end if;

    select coalesce(
      (select name from public.task_statuses where name = p_status),
      (select name from public.task_statuses where is_default limit 1),
      'pending'
    ) into v_status;

    insert into public.tasks
      (title, description, status, priority, drive_link, due_date, agent_name, ops_project_id, client_id, created_by)
    values
      (trim(p_title), nullif(trim(p_description), ''), v_status, coalesce(v_priority, 'medium'),
       nullif(trim(p_link), ''), p_due_date, trim(p_agent_name), v_project_id, v_client_id, null)
    returning id into v_id;
  end if;

  return v_id;
end;
$func$;
