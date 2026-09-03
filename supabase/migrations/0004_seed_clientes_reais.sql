-- ============================================================
-- Central Emerge — 0004: seed dos CLIENTES REAIS
-- (nota "Dados Reais — Emerge"). Rodar DEPOIS da 0003.
--
-- - Não apaga o dado de teste (risco de FK). Marca os reais com
--   is_seed = true; a /clientes filtra por isso.
-- - Constraints checadas na base (02/09):
--     clients.status            CHECK ('active','inactive')  → 'active'
--     recurring_projects.status sem CHECK; valor em uso      → 'active'
--     specific_projects.status  sem CHECK; valor em uso      → 'pending'
-- - Valores dos projetos pontuais: a definir com o time → total_amount 0.
-- Idempotente (re-rodar não duplica).
-- ============================================================

-- 1. Clientes recorrentes -----------------------------------------------
insert into public.clients (name, segment, mrr, status, is_seed)
select v.name, v.segment, v.mrr, 'active', true
from (values
  ('Varanda Estaiada', 'casa de eventos',  6000),
  ('Emerge Labs',      'braço de produto', 6000),
  ('Rodrigo Salazar',  'DJ / artista',     2500),
  ('Dsec Lab',         'cripto / Web3',    1800),
  ('Instituto',        null,               1680)
) as v(name, segment, mrr)
where not exists (
  select 1 from public.clients c
  where c.name = v.name and c.is_seed = true
);

-- 2. Contrato recorrente por cliente (MRR = clients.mrr) --------------
insert into public.recurring_projects (client_id, title, monthly_amount, status, start_date)
select c.id, 'Contrato recorrente', c.mrr, 'active', current_date
from public.clients c
where c.is_seed = true
  and c.mrr > 0
  and not exists (
    select 1 from public.recurring_projects rp
    where rp.client_id = c.id and rp.title = 'Contrato recorrente'
  );

-- 3. Projetos pontuais ativos hoje -----------------------------------
insert into public.specific_projects (client_id, title, status, total_amount)
select c.id, p.title, 'pending', 0
from (values
  ('Dsec Lab',        'Domini'),
  ('Rodrigo Salazar', 'Captação'),
  ('Rodrigo Salazar', 'Calendário'),
  ('Rodrigo Salazar', 'Google Meu Negócio'),
  ('Rodrigo Salazar', 'Atualização de site')
) as p(client, title)
join public.clients c on c.name = p.client and c.is_seed = true
where not exists (
  select 1 from public.specific_projects sp
  where sp.client_id = c.id and sp.title = p.title
);
