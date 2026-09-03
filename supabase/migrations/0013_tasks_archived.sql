-- EPIC Tarefas 3e — arquivamento de tarefas. Aditivo, idempotente,
-- com default → não quebra Lovable nem linhas existentes.
alter table public.tasks
  add column if not exists archived boolean not null default false;
