-- ============================================================
-- Segunda unidade de negócio no funil de vendas: Emerge Labs
-- (tecnologia/automação, já rodando) e Emerge Tech (agência de
-- marketing/social media, nova — site emergeoficial.com).
-- Aditivo. Não mexe nos leads/estágios existentes (default 'labs'
-- preserva todo o histórico atual).
-- ============================================================

alter table public.vendas_leads
  add column if not exists unidade text not null default 'labs'
    check (unidade in ('labs', 'tech'));

create index if not exists vendas_leads_unidade_idx on public.vendas_leads(unidade);

-- Cliente interno "Emerge Tech" (mesmo padrão do "Emerge Labs" já existente)
-- pra servir de nó de agrupamento na árvore de Nós/Tarefas.
insert into public.clients (name, status, segment, mrr, is_seed)
select 'Emerge Tech', 'active', 'agência de marketing (social media)', 0, true
where not exists (select 1 from public.clients where name = 'Emerge Tech');

-- Projeto ops separado pra Emerge Tech, com default_client_id apontando pro
-- cliente acima — assim tasks criadas via
-- ops_agent_upsert_task('central-emerge-tech', ...) caem automaticamente sob
-- o cliente certo na árvore de Nós, em vez do default (Emerge Labs) do
-- projeto "central-emerge".
insert into public.ops_projects (slug, name, default_client_id)
select 'central-emerge-tech', 'Central Emerge — Tech',
       (select id from public.clients where name = 'Emerge Tech')
where not exists (select 1 from public.ops_projects where slug = 'central-emerge-tech');
