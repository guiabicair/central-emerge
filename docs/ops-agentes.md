# Agentes em /tarefas — protocolo pra agentes de OUTROS projetos reportarem na Central

Qualquer agente Claude Code rodando num terminal Maestri — de qualquer projeto, não
só a Central — pode criar/concluir tarefas DE VERDADE em `/tarefas`, **direto no
Supabase**, sem passar por nenhuma rota da Central. A tarefa aparece nas 5 views
(Kanban/Lista/Calendário/Cronograma/**Nós**) com um badge 🤖 mostrando qual agente
fez o quê.

Histórico: a primeira versão disso era um módulo separado (`/operacoes`, migration
`0022`). O usuário pediu pra mover pra dentro de Tarefas em vez de um lugar à parte
— `ops_projects` (registro de projeto) e as funções da 0022 continuam de pé, só a
UI de roadmap separada foi removida. Migration atual: `0023_tarefas_agentes_nodes.sql`.

## Credenciais

Mesmo projeto Supabase da Central (`vaxotbozscqaczwzaxtr`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Pegue os dois valores com `vercel env pull` neste diretório (`~/emerge-propostas-work`)
ou peça pro Guilherme/Claude Code. **Não é preciso login de usuário** — as funções
abaixo são `SECURITY DEFINER` e aceitam a chave anônima; são a ÚNICA porta de entrada
aberta pra `anon` (as tabelas continuam com RLS fechada pra escrita direta).

## A função principal: `ops_agent_upsert_task`

Chame via `supabase.rpc(...)` (JS) ou `POST {SUPABASE_URL}/rest/v1/rpc/ops_agent_upsert_task`
com header `apikey`/`Authorization: Bearer <anon key>`.

```ts
// criar uma tarefa nova
const { data: taskId } = await supabase.rpc("ops_agent_upsert_task", {
  p_project_slug: "meu-projeto",      // slug livre; cria o projeto (ops_projects) se não existir
  p_agent_name: "Batedor",            // nome do agente/role no Maestri — vira o badge 🤖 no card
  p_title: "Migrar auth pra X",
  p_status: "pending",                // opcional — precisa bater com um nome real de task_statuses;
                                       // se não bater ou for omitido, cai no status default do board
  p_priority: "high",                 // low | medium | high | urgent — opcional (default medium)
  p_description: "detalhe opcional",
  p_link: "https://preview-url...",   // vira o link "Drive" no card — PR, deploy, doc
  p_due_date: "2026-09-20",           // opcional, formato YYYY-MM-DD
});

// atualizar/concluir depois — passe o id retornado na criação
await supabase.rpc("ops_agent_upsert_task", {
  p_project_slug: "meu-projeto",
  p_agent_name: "Batedor",
  p_task_id: taskId,
  p_status: "completed",
});
```

`p_status` precisa bater com um `task_statuses.name` que já existe no board (hoje:
`pending`, `in_progress`, `completed`, `cancelled`, mais qualquer coluna custom que
o time tiver criado pela UI). Se não bater, a tarefa não quebra — só fica no status
que já tinha (update) ou no default do board (create).

## Onde isso aparece

`central-emerge.vercel.app/tarefas` — toolbar Kanban / Lista / Calendário /
Cronograma / **Nós**. Toda tarefa com `agent_name` preenchido ganha o badge 🤖 nas
5 views. A view **Nós** (React Flow, board `tarefas`) mostra as tarefas filtradas
como nós de verdade: arrastar persiste a posição, puxar de um nó a outro cria uma
conexão manual persistida, o botão "Nova tarefa" no canto cria uma tarefa nova (real,
não só visual) que vira nó na hora — mesmo mecanismo já usado em Pipeline/Equipe
(`<EntityCanvas>`, migration `0009`), sem permissão nova (`tarefas.manage`).

## Extra opcional: log de atividade solto (não aparece em Tarefas)

As funções da 0022 (`ops_report_activity`, `ops_upsert_roadmap_item`) continuam
ativas se algum agente quiser logar algo que não é uma tarefa (ex: "comecei a
investigar X"), mas isso não aparece em nenhuma tela hoje — é só um registro cru em
`ops_agent_activity`/`ops_roadmap_items`. Pra aparecer na Central, use
`ops_agent_upsert_task`.

## Alerta ativo quando algo quebra (migration 0031)

Até 13/09/2026, uma falha de rotina (ex: Gmail desconectado, erro na hora de
enviar outreach) só ficava registrada em texto livre na `description` da
task viva do agente — só se descobria entrando lá. Agora existe um caminho
estruturado que dispara notificação push de verdade (ver `ops_alerts` +
`push_subscriptions`, painel em Configurações → Integrações → "Notificações
push"):

- Reportando **numa task existente**: chame `ops_agent_upsert_task` com
  `p_status: "blocked"` (além de continuar atualizando a `description` com o
  resumo). Isso dispara um alerta automaticamente (trigger em `tasks`).
- Reportando **sem task** (ex: rotina cloud contínua tipo Outreach/Captação,
  que nunca marca a task como completed): chame `ops_report_activity` com
  `p_event_type: "blocked"` e `p_summary`/`p_detail` explicando o que quebrou
  (ex: "Gmail desconectado — refresh_token inválido"). Isso também dispara
  o alerta (trigger em `ops_agent_activity`), sem precisar mexer no status
  da task viva.

Nos dois casos, o alerta só dispara na TRANSIÇÃO pra 'blocked' (ou no
`INSERT` do evento) — não fica repetindo a cada rodada se a rotina continuar
reportando o mesmo problema. Se resolver e quebrar de novo depois, volte o
status pra `in_progress`/`pending` e depois pra `blocked` de novo (ou
mande outro `ops_report_activity` com `event_type: "blocked"`) pra reabrir
o alerta.
