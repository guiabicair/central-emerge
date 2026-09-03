-- ============================================================
-- Central Emerge — 0009: Canvas editável de nós (EPIC)
--
-- Persiste posição de nós + arestas MANUAIS de um canvas por aba.
-- Tabelas genéricas, SEM FK pras tabelas do Lovable (entity_id é texto).
-- Só as arestas manuais são gravadas — as derivadas de FK o app desenha.
--
--   owner = sentinel 00000000-…-0000  → layout COMPARTILHADO (padrão)
--   owner = uuid do usuário            → layout pessoal (evolução; não
--                                        usado pelo núcleo ainda)
--
-- Aditivo. Idempotente.
-- ============================================================

create table if not exists public.app_canvas_nodes (
  id         uuid primary key default gen_random_uuid(),
  board      text not null,
  entity_id  text not null,
  x          numeric not null default 0,
  y          numeric not null default 0,
  owner      uuid not null default '00000000-0000-0000-0000-000000000000',
  updated_at timestamptz not null default now(),
  updated_by uuid,
  unique (board, entity_id, owner)
);
create index if not exists app_canvas_nodes_board_idx
  on public.app_canvas_nodes (board, owner);

create table if not exists public.app_canvas_edges (
  id            uuid primary key default gen_random_uuid(),
  board         text not null,
  source_entity text not null,
  target_entity text not null,
  label         text,
  meta          jsonb not null default '{}',
  owner         uuid not null default '00000000-0000-0000-0000-000000000000',
  created_at    timestamptz not null default now(),
  created_by    uuid,
  unique (board, source_entity, target_entity, owner)
);
create index if not exists app_canvas_edges_board_idx
  on public.app_canvas_edges (board, owner);

alter table public.app_canvas_nodes enable row level security;
alter table public.app_canvas_edges enable row level security;

-- leitura: qualquer autenticado (layout não é sensível)
drop policy if exists "canvas nodes read" on public.app_canvas_nodes;
create policy "canvas nodes read" on public.app_canvas_nodes
  for select to authenticated using (true);

drop policy if exists "canvas edges read" on public.app_canvas_edges;
create policy "canvas edges read" on public.app_canvas_edges
  for select to authenticated using (true);

-- escrita: dono do layout pessoal OU quem tem <board>.manage no compartilhado
drop policy if exists "canvas nodes write" on public.app_canvas_nodes;
create policy "canvas nodes write" on public.app_canvas_nodes
  for all to authenticated
  using (
    owner = auth.uid()
    or (owner = '00000000-0000-0000-0000-000000000000'
        and public.app_has_permission(auth.uid(), board || '.manage'))
  )
  with check (
    owner = auth.uid()
    or (owner = '00000000-0000-0000-0000-000000000000'
        and public.app_has_permission(auth.uid(), board || '.manage'))
  );

drop policy if exists "canvas edges write" on public.app_canvas_edges;
create policy "canvas edges write" on public.app_canvas_edges
  for all to authenticated
  using (
    owner = auth.uid()
    or (owner = '00000000-0000-0000-0000-000000000000'
        and public.app_has_permission(auth.uid(), board || '.manage'))
  )
  with check (
    owner = auth.uid()
    or (owner = '00000000-0000-0000-0000-000000000000'
        and public.app_has_permission(auth.uid(), board || '.manage'))
  );
