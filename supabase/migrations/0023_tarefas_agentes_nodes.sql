-- ============================================================
-- Central Emerge — 0023: Operações/Agentes migra pra DENTRO de Tarefas
--
-- Decisão do usuário (11/09): agentes de qualquer projeto/terminal Maestri
-- devem criar/concluir tarefas DE VERDADE em /tarefas (não um log paralelo
-- em /operacoes), com um badge visual de agente, e /tarefas ganha uma view
-- de NÓS (reaproveitando o núcleo <EntityCanvas> da 0009 — mesmo board
-- editável de arrastar/criar/conectar já usado em Pipeline e Equipe).
--
-- Aditivo. tasks.status/priority continuam exatamente como estão (o RPC
-- valida contra task_statuses.name, mesma regra da action humana desde o
-- 3b/0012). Nenhuma coluna/constraint existente é tocada.
--
-- Segurança (achado do Claude Code, 11/09): o UPDATE é escopado por
-- ops_project_id = v_project_id — um agente só edita tasks que já
-- pertencem ao próprio projeto (mesmo padrão do ops_upsert_roadmap_item
-- da 0022). Sem isso, a função (grantada pra anon) deixaria qualquer
-- portador da anon key sobrescrever QUALQUER task do sistema por UUID.
-- ============================================================

alter table public.tasks add column if not exists agent_name text;
alter table public.tasks add column if not exists ops_project_id uuid references public.ops_projects(id) on delete set null;

create index if not exists tasks_ops_project_idx on public.tasks(ops_project_id);

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
  v_status text;
  v_priority text;
  v_id uuid;
begin
  if p_agent_name is null or trim(p_agent_name) = '' then
    raise exception 'agent_name é obrigatório';
  end if;

  v_project_id := public.ops_ensure_project(p_project_slug, null);
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
      (title, description, status, priority, drive_link, due_date, agent_name, ops_project_id, created_by)
    values
      (trim(p_title), nullif(trim(p_description), ''), v_status, coalesce(v_priority, 'medium'),
       nullif(trim(p_link), ''), p_due_date, trim(p_agent_name), v_project_id, null)
    returning id into v_id;
  end if;

  return v_id;
end;
$func$;

grant execute on function public.ops_agent_upsert_task(text, text, text, uuid, text, text, text, text, date) to anon, authenticated;
