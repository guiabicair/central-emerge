-- ============================================================
-- Central Emerge — 0032: status 'blocked' vira coluna real do board
--
-- Achado testando a 0031: `ops_agent_upsert_task` só aceita `p_status` que
-- bate com um `task_statuses.name` existente (senão ignora e mantém o
-- status anterior). 'blocked' já é usado em produção (ex: task "Painel de
-- saúde dos agentes"), mas só foi setado via UPDATE direto — nunca existiu
-- como coluna de verdade, então o trigger de alerta da 0031 (que dispara
-- na transição pra 'blocked' via essa RPC) nunca teria disparado pra
-- agentes externos que seguem o protocolo documentado.
--
-- Aditivo: só insere uma linha nova em task_statuses (posição 4, o único
-- número livre entre completed=3 e revisao=5). Nenhuma coluna/tarefa
-- existente é alterada.
-- ============================================================

-- Sem unique constraint em task_statuses.name (só PK em id) — usa
-- WHERE NOT EXISTS em vez de ON CONFLICT.
insert into public.task_statuses (name, color, position, is_default)
select 'blocked', 'rose', 4, false
where not exists (select 1 from public.task_statuses where name = 'blocked');
