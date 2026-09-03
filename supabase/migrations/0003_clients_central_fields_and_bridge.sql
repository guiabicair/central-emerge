-- ============================================================
-- Central Emerge — 0003: Clientes (CRUD real da /clientes)
--
--  (1) Campos que o CRUD da Central usa em public.clients. Todos
--      nullable / com default → o app Lovable ignora e não quebra.
--        mrr           numeric  — MRR mensal (snapshot; o hub 360 vai
--                                 reconciliar com recurring_projects)
--        segment       text     — tipo / segmento do cliente
--        contact_name  text     — pessoa de contato
--        notes         text     — observações
--        is_seed       boolean  — marca os clientes REAIS; a lista
--                                 mostra só is_seed = true por padrão
--                                 (o dado de teste antigo não é apagado)
--
--  (2) Bridge de RLS: além do admin-Lovable (get_user_role = 'admin'),
--      quem tem a permissão `clientes.manage` do sistema de papéis
--      (migration 0001) também pode escrever. OR com a policy antiga,
--      mesmo padrão do 0002.
--
-- Aditivo. Idempotente.
-- ============================================================

alter table public.clients add column if not exists mrr          numeric not null default 0;
alter table public.clients add column if not exists segment      text;
alter table public.clients add column if not exists contact_name text;
alter table public.clients add column if not exists notes        text;
alter table public.clients add column if not exists is_seed      boolean not null default false;

drop policy if exists "app clientes manage clients" on public.clients;
create policy "app clientes manage clients" on public.clients
  for all to authenticated
  using (public.app_has_permission(auth.uid(), 'clientes.manage'))
  with check (public.app_has_permission(auth.uid(), 'clientes.manage'));
