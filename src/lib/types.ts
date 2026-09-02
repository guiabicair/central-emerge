/**
 * Modelo de dominio da Central Emerge (Fase 1 — sem Supabase ainda).
 * Espelha a "Prospeccao Organizada" do app atual: cada card do pipeline
 * e um Lead/Deal com contato, segmento, tag colorida, estagio e valor.
 * Quando o schema real do Supabase entrar, estes tipos viram a fonte
 * de verdade do client tipado.
 */

export type PipelineStageId =
  | "lead"
  | "primeira-chamada"
  | "reuniao"
  | "proposta"
  | "negociacao"
  | "fechado"
  | "perdido";

export interface TeamMember {
  id: string;
  nome: string;
  /** iniciais pre-calculadas para o avatar fallback */
  iniciais: string;
  cor: string;
  avatarUrl?: string;
}

/** Cor da "tag colorida" do card, como no Kanban atual. */
export type LeadTagColor =
  | "aqua"
  | "lime"
  | "violet"
  | "blue"
  | "amber"
  | "rose"
  | "slate";

export interface LeadTag {
  label: string;
  color: LeadTagColor;
}

export interface Lead {
  id: string;
  nome: string;
  empresa?: string;
  telefone?: string;
  email?: string;
  site?: string;
  segmento: string;
  tag: LeadTag;
  stage: PipelineStageId;
  /** valor potencial do negocio em BRL (centavos evitados: usamos reais) */
  valor: number;
  responsavelId: string;
  /** ISO date da ultima interacao — alimenta a ordenacao/urgencia */
  atualizadoEm: string;
  origem?: string;
  observacao?: string;
}

/* --------------------------------------------------------------------------
 * Clientes — negocios ja fechados (a aba "Clientes" da Lovable).
 * Nao confundir com Lead: um Cliente pode ter nascido de um Lead com
 * stage "fechado" (origemLeadId) ou ter sido cadastrado direto.
 * ---------------------------------------------------------------------- */

export type ClientStatus = "ativo" | "pausado" | "encerrado";

export interface Client {
  id: string;
  nome: string;
  empresa: string;
  segmento: string;
  /** valor do contrato em BRL (mensal ou total — tratado como recorrente aqui) */
  valorContrato: number;
  responsavelId: string;
  status: ClientStatus;
  /** ISO date do fechamento do contrato */
  fechadoEm: string;
  origemLeadId?: string;
}

/* --------------------------------------------------------------------------
 * Tarefas — Kanban de PRODUCAO DE CONTEUDO (aba "Tarefas" da Lovable).
 * As colunas nao sao status genericos: representam um fluxo de producao
 * (Briefing -> Solicitacao -> Em producao -> Alteracao -> Pausa ->
 * Aprovacao) e sao customizaveis pelo usuario ("+ Nova Coluna").
 * ---------------------------------------------------------------------- */

/** id de coluna do Kanban — string livre porque as colunas sao editaveis. */
export type TaskColumnId = string;

export interface TaskColumn {
  id: TaskColumnId;
  label: string;
  accent: string;
  descricao?: string;
  /** colunas criadas pelo usuario (nao fazem parte do fluxo padrao) */
  custom?: boolean;
}

export type TaskPriority = "baixa" | "media" | "alta" | "urgente";

export interface TaskReference {
  label: string;
  url: string;
}

export interface TaskComment {
  autorId: string;
  texto: string;
  /** ISO date */
  data: string;
}

export interface TaskTimeEntry {
  pessoaId: string;
  horas: number;
  /** ISO date */
  data: string;
}

export interface TaskSubtask {
  id: string;
  label: string;
  concluida: boolean;
}

export interface TaskApproval {
  status: "pendente" | "aprovada" | "devolvida";
  por?: string;
  comentario?: string;
}

export interface TaskGoalLink {
  label: string;
  valorAlvo: number;
  valorAtual: number;
  unidade: string;
}

/** Responsavel por destravar uma dependencia: um membro da equipe ou um cliente. */
export interface DependencyResponsavel {
  tipo: "equipe" | "cliente";
  /** id de TeamMember (tipo "equipe") ou de Client (tipo "cliente") */
  id: string;
}

/**
 * Uma dependencia = "esta task esta bloqueada pela task `taskId`".
 * Toda dependencia exige um motivo e um responsavel por destrava-la.
 */
export interface TaskDependency {
  taskId: string;
  motivo: string;
  responsavel: DependencyResponsavel;
}

export interface Task {
  id: string;
  titulo: string;
  /** quem executa */
  responsavelId: string;
  /** cliente vinculado (diferente do responsavel); ausente = "Sem cliente" */
  clienteId?: string;
  /** coluna atual no Kanban de producao */
  status: TaskColumnId;
  /** ISO date do prazo */
  prazo: string;
  prioridade: TaskPriority;
  categoria: string;
  /** descricao longa / multi-linha */
  briefing: string;
  referencias: TaskReference[];
  /** tasks que bloqueiam esta (edge: bloqueadora -> esta), com motivo e responsavel */
  dependsOn: TaskDependency[];
  subtarefas: TaskSubtask[];
  comentarios: TaskComment[];
  aprovacao: TaskApproval;
  /** link da pasta no Drive; ausente = estado vazio "Sem pasta vinculada" */
  driveLink?: string;
  horasEstimadas?: number;
  /** log de tempo; total registrado = soma via totalHoras() */
  registrosTempo: TaskTimeEntry[];
  /** vinculo opcional com uma metrica/meta da equipe */
  meta?: TaskGoalLink;
}

/* --------------------------------------------------------------------------
 * Financeiro — resumo de caixa + transacoes (aba "Financeiro" da Lovable).
 * ---------------------------------------------------------------------- */

export type TransactionType = "entrada" | "saida";
export type TransactionStatus = "pago" | "pendente";

export interface Transaction {
  id: string;
  descricao: string;
  /** cliente/fornecedor associado */
  parte: string;
  /** valor sempre positivo em BRL; o sinal vem de `tipo` */
  valor: number;
  tipo: TransactionType;
  /** ISO date */
  data: string;
  status: TransactionStatus;
}

export interface FinanceSummary {
  caixaAtual: number;
  aReceber: number;
  receitaMes: number;
  /** 0..1 */
  taxaInadimplencia: number;
}
