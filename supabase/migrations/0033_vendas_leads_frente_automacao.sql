-- ============================================================
-- Emerge Labs passou a prospectar sem nicho fixo (direcionamento do
-- Guilherme, 15/09/2026) — o Batedor já rotula leads fora do setor de
-- eventos com frente='automacao'. O CHECK constraint de vendas_leads.frente
-- (criado fora do histórico de migrations, provavelmente direto via SQL
-- numa rodada anterior) ainda só permitia 'eventos' além dos valores
-- legados. Aditivo — não remove nenhum valor existente.
-- ============================================================

alter table public.vendas_leads
  drop constraint if exists vendas_leads_frente_check;

alter table public.vendas_leads
  add constraint vendas_leads_frente_check
  check (frente = any (array[
    'criptoforja', 'grupo_today_os', 'emerge_financeiro',
    'emerge_propostas_dev', 'eventos', 'automacao', 'outro'
  ]));
