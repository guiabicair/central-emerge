# Tarefas — paridade com a Central antiga (Lovable /tasks)

Reconstruído do chunk `assets/Tasks-CkxZkMSC.js` do sistemaemerge.lovable.app. O que a versão nova do Nomad tem é SÓ o Kanban básico. Falta:

## Views (a antiga tem 4, a nova tem 1)
- **Kanban** ✓ (tem)
- **Lista** — tabela com colunas ordenáveis ("Ver Lista")
- **Calendário** — tarefas com prazo num grid mensal ("Ver Calendário" / react-big-calendar) — Month / Week / Work Week / Agenda
- **Cronograma de Tasks** — linha do tempo por prazo

## Colunas do Kanban
- **Colunas customizáveis** pelo usuário: "Nova Coluna" / "Nome da coluna" → usa `task_statuses` (name/color/position/is_default) DE VERDADE, não os 4 status fixos do CHECK. A nova versão ignorou `task_statuses`.

## Campos da task (form Criar/Editar)
Tem hoje: título, descrição, status, prioridade (baixa/média/alta/urgente), cliente, prazo, responsáveis múltiplos.
Falta:
- **Link do Drive** (`tasks.drive_link` — coluna JÁ EXISTE no schema, só não está no form)
- **Link do Figma** (`tasks.figma_link` — idem)
- **BRIEFING** (descrição longa / campo separado da descrição curta)
- **Anexos**
- **Subtarefas** (`subtasks` — tabela existe: parent_task_id, title, assigned_to, status, priority, due_date)
- **Rascunho salvo** (localStorage — não perde o que digitou se fechar)

## Ações em lote
- **Modo seleção múltipla** (multi-select de cards)
- **Arquivar todas as tarefas** / **Concluir e arquivar todas** (bulk)
- Arquivamento em lote

## Filtros e produtividade
- **Filtros Avançados** (por prioridade, status, cliente, período)
- **Atalhos de Teclado**: P=pendentes · C=concluídas · 1=urgente · 2=alta · 3=média · 4=baixa · R=todas · Esc=limpar seleção
- Filtros salvos: **Minhas** · **Hoje** · **Atrasadas** (com contador)
- "Filtro aplicado" / "Filtros removidos" (toasts)

## Do Bloco 2 (schema já pronto, só faltam RLS + UI)
- **Entregas** (`task_deliveries`: drive_folder_url, description, status, submitted_by, reviewed_by, feedback) — submeter entrega + fluxo de revisão
- **Cronômetro** (`time_entries`: start_time, end_time, is_active) — timer por tarefa
- **Templates** (`task_templates`) — criar task/projeto a partir de modelo
- **Comentários** (`task_comments`)

## NÃO eram features reais da Lovable (foram invenção do mock da Fase 1 — avaliar se quer)
- Referências (lista de URLs por task), vínculo com meta/goal, grafo de dependências entre tasks.
