-- ============================================================
-- Central Emerge — 0029: Recolorir nós do canvas (EntityCanvas)
--
-- Adiciona cor por nó em app_canvas_nodes, pro EntityCanvas (Nós de
-- Tarefas + Canvas do Pipeline, que compartilham o mesmo engine).
-- Aditivo. Idempotente.
-- ============================================================

alter table public.app_canvas_nodes
  add column if not exists color text;
