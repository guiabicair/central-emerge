# Operações/Agentes — protocolo pra agentes de OUTROS projetos reportarem na Central

Módulo `/operacoes` (migration `0022_ops_agentes.sql`). Qualquer agente Claude Code
rodando num terminal Maestri — de qualquer projeto, não só a Central — pode reportar
o que fez e mexer no roadmap do próprio projeto **direto no Supabase**, sem passar
por nenhuma rota da Central.

## Credenciais

Mesmo projeto Supabase da Central (`vaxotbozscqaczwzaxtr`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Pegue os dois valores com `vercel env pull` neste diretório (`~/emerge-propostas-work`)
ou peça pro Guilherme/Claude Code. **Não é preciso login de usuário** — as 3 funções
abaixo são `SECURITY DEFINER` e aceitam a chave anônima; elas são a ÚNICA porta de
entrada aberta pra `anon` (as tabelas `ops_*` continuam com RLS fechada pra escrita,
só leitura autenticada pela UI).

## As 3 funções (RPC)

Chame via `supabase.rpc(...)` (JS) ou `POST {SUPABASE_URL}/rest/v1/rpc/<fn>` com
header `apikey`/`Authorization: Bearer <anon key>`.

### `ops_report_activity` — loga uma entrada no feed de atividade

```ts
await supabase.rpc("ops_report_activity", {
  p_project_slug: "meu-projeto",       // slug livre; cria o projeto se não existir
  p_agent_name: "Batedor",             // nome do agente/role no Maestri
  p_summary: "Fechou o CRUD de X",     // obrigatório, curto
  p_event_type: "completed",           // started | progress | completed | blocked | deployed
  p_detail: "detalhe opcional",
  p_link: "https://preview-url...",    // PR, deploy, doc — opcional
});
```

### `ops_upsert_roadmap_item` — cria ou atualiza um item do roadmap do projeto

```ts
// criar
await supabase.rpc("ops_upsert_roadmap_item", {
  p_project_slug: "meu-projeto",
  p_title: "Migrar auth pra X",
  p_status: "backlog",       // backlog | in_progress | blocked | done
  p_priority: "p1",          // p0 | p1 | p2 | p3
  p_agent_name: "Batedor",
});

// atualizar (mover de coluna, por ex.) — passe o id retornado na criação
await supabase.rpc("ops_upsert_roadmap_item", {
  p_project_slug: "meu-projeto",
  p_item_id: "<uuid do item>",
  p_status: "done",
});
```

### `ops_ensure_project` — registra um projeto novo sem criar item nenhum (opcional)

```ts
await supabase.rpc("ops_ensure_project", {
  p_slug: "meu-projeto",
  p_name: "Nome bonito do projeto",
});
```

Os dois primeiros já chamam isso internamente — só use direto se quiser só cadastrar
o projeto com um nome legível antes de reportar a primeira atividade (senão o `slug`
vira o nome até alguém editar pela UI).

## Onde isso aparece

`central-emerge.vercel.app/operacoes` (gate: permissão `ops.view`/`ops.manage`) —
seletor de projeto, board de roadmap (4 colunas) e feed de atividade por projeto.
Humanos com `ops.manage` podem mover itens de coluna pela UI; criar/editar item e
projeto por enquanto é só via RPC (fast-follow se quiser formulário na UI).
