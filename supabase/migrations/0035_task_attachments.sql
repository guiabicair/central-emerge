-- ============================================================
-- Anexos/referências de tarefa: links soltos (briefing, referência
-- visual, planilha, doc, etc.) que não são uma "entrega" formal
-- (task_deliveries, que passa por aprovação) — só material de apoio
-- que qualquer um pode anexar ao abrir a tarefa. Aditivo.
-- ============================================================

create table if not exists public.task_attachments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  url        text not null,
  label      text,
  added_by   uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists task_attachments_task_idx on public.task_attachments(task_id);

alter table public.task_attachments enable row level security;

create policy "app tarefas view task_attachments" on public.task_attachments
  for select to authenticated
  using (app_has_permission(auth.uid(), 'tarefas.view'));

create policy "app tarefas manage task_attachments" on public.task_attachments
  for all to authenticated
  using (app_has_permission(auth.uid(), 'tarefas.manage'))
  with check (app_has_permission(auth.uid(), 'tarefas.manage'));
