-- Pipeline v2 / BUG#14-A: a FK vendas_leads.proposta_slug -> propostas(slug)
-- quebra o "vincular proposta". A tabela `propostas` (gerador emerge-propostas)
-- hoje está vazia, então QUALQUER slug digitado viola a FK e o save do lead
-- dá erro. O card só usa o slug pra montar a URL pública
-- emerge-propostas.vercel.app/<slug> — nunca faz join com `propostas`.
-- Decisão (ACK Régie): slug vira ponteiro de texto livre. Dropar a FK.
-- Idempotente.

alter table public.vendas_leads
  drop constraint if exists vendas_leads_proposta_slug_fkey;
