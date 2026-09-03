import { PipelineFunnelChart } from "@/components/dashboard/pipeline-funnel-chart";
import { SectionCard } from "@/components/dashboard/section-card";
import { TaskStatusChart } from "@/components/dashboard/task-status-chart";
import { Topbar } from "@/components/layout/topbar";
import { StatTile } from "@/components/stat-tile";
import { can } from "@/lib/auth/roles";
import type { FunnelRow, StatusRow } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/server";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

export const metadata = { title: "Dashboard · Central Emerge" };

/**
 * Dashboard REAL — só agrega o que já está ligado no Supabase:
 * clientes + MRR (clients), caixa + meta (financeiro), pipeline (vendas_leads),
 * tarefas (tasks). O que ainda é mock (carga por pessoa, horas, receita
 * acumulada) fica de fora — escondido, não fake.
 */

const LEAD_STAGES: { id: string; label: string; accent: string }[] = [
  { id: "novo", label: "Novo", accent: "#a78bfa" },
  { id: "contatado", label: "Contatado", accent: "#45f0d1" },
  { id: "qualificado", label: "Qualificado", accent: "#34d399" },
  { id: "virou_proposta", label: "Virou proposta", accent: "#c9ff3f" },
  { id: "proposta_aprovada", label: "Proposta aprovada", accent: "#22c55e" },
  { id: "descartado", label: "Descartado", accent: "#71717a" },
];

const TASK_STATUSES: { id: string; label: string; accent: string }[] = [
  { id: "pending", label: "A fazer", accent: "#a78bfa" },
  { id: "in_progress", label: "Em andamento", accent: "#45f0d1" },
  { id: "completed", label: "Concluída", accent: "#34d399" },
  { id: "cancelled", label: "Cancelada", accent: "#71717a" },
];

const OPEN_STAGES = new Set([
  "novo",
  "contatado",
  "qualificado",
  "virou_proposta",
]);

function ym(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const periodo = ym(new Date());

  const [canClientes, canFin, canPipe, canTasks] = await Promise.all([
    can("clientes.view"),
    can("financeiro.view"),
    can("pipeline.view"),
    can("tarefas.view"),
  ]);

  const [clientsRes, cashRes, metaRes, leadsRes, tasksRes] = await Promise.all([
    canClientes
      ? supabase.from("clients").select("mrr").eq("is_seed", true)
      : Promise.resolve({ data: [], error: null } as const),
    canFin
      ? supabase
          .from("company_cash")
          .select("current_amount")
          .order("updated_at", { ascending: false })
          .limit(1)
      : Promise.resolve({ data: [], error: null } as const),
    canFin
      ? supabase
          .from("vendas_metas")
          .select("meta_valor, realizado_valor")
          .eq("periodo", periodo)
      : Promise.resolve({ data: [], error: null } as const),
    canPipe
      ? supabase.from("vendas_leads").select("status, valor_estimado")
      : Promise.resolve({ data: [], error: null } as const),
    canTasks
      ? supabase.from("tasks").select("status")
      : Promise.resolve({ data: [], error: null } as const),
  ]);

  // ---- Clientes + MRR (clients.mrr, só carteira curada) ----
  const showClientes = canClientes && !clientsRes.error;
  const clientRows = (clientsRes.data ?? []) as { mrr: number | null }[];
  const totalClientes = clientRows.length;
  const mrr = clientRows.reduce((s, r) => s + (Number(r.mrr) || 0), 0);

  // ---- Financeiro ----
  const showCaixa = canFin && !cashRes.error;
  const cashRows = (cashRes.data ?? []) as { current_amount: number | null }[];
  const caixaHoje = Number(cashRows[0]?.current_amount) || 0;

  const metaRows = (metaRes.data ?? []) as {
    meta_valor: number | null;
    realizado_valor: number | null;
  }[];
  const showMeta = canFin && !metaRes.error && metaRows.length > 0;
  const metaMes = metaRows.reduce((s, r) => s + (Number(r.meta_valor) || 0), 0);
  const realizadoMes = metaRows.reduce(
    (s, r) => s + (Number(r.realizado_valor) || 0),
    0,
  );

  // ---- Pipeline (vendas_leads) ----
  const showPipe = canPipe && !leadsRes.error;
  const leads = ((leadsRes.data ?? []) as {
    status: string;
    valor_estimado: number | null;
  }[]).map((l) => ({
    status: l.status,
    valor: Number(l.valor_estimado) || 0,
  }));
  const funnel: FunnelRow[] = LEAD_STAGES.map((st) => {
    const rows = leads.filter((l) => l.status === st.id);
    return {
      stageId: st.id,
      label: st.label,
      accent: st.accent,
      count: rows.length,
      valor: rows.reduce((s, l) => s + l.valor, 0),
    };
  });
  const totalLeads = leads.length;
  const emAberto = leads
    .filter((l) => OPEN_STAGES.has(l.status))
    .reduce((s, l) => s + l.valor, 0);

  // ---- Tarefas (tasks) ----
  const showTasks = canTasks && !tasksRes.error;
  const tasks = ((tasksRes.data ?? []) as { status: string }[]).map(
    (t) => t.status,
  );
  const statusRows: StatusRow[] = TASK_STATUSES.map((st) => ({
    id: st.id,
    label: st.label,
    accent: st.accent,
    count: tasks.filter((s) => s === st.id).length,
  }));
  const totalTasks = tasks.length;
  const emAndamento = tasks.filter((s) => s === "in_progress").length;
  const concluidas = tasks.filter((s) => s === "completed").length;

  const nadaLiberado = !showClientes && !showCaixa && !showPipe && !showTasks;

  return (
    <>
      <Topbar
        title="Dashboard"
        description="Visão consolidada — só números reais dos módulos já conectados"
      />

      <div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
        {nadaLiberado ? (
          <div className="border-line bg-surface rounded-2xl border p-6 text-sm">
            <p className="font-medium">Nada para exibir ainda.</p>
            <p className="text-ink-muted mt-1">
              Você não tem acesso a nenhum módulo com métricas (Clientes,
              Financeiro, Pipeline ou Tarefas).
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {showClientes && (
                <StatTile
                  label="Clientes ativos"
                  value={totalClientes}
                  hint="carteira curada"
                />
              )}
              {showClientes && (
                <StatTile
                  label="MRR"
                  value={formatCurrency(mrr)}
                  hint="receita recorrente"
                  accent="data"
                />
              )}
              {showCaixa && (
                <StatTile
                  label="Caixa hoje"
                  value={formatCurrency(caixaHoje)}
                  hint="último ajuste de company_cash"
                />
              )}
              {showMeta && (
                <StatTile
                  label="Meta do mês"
                  value={formatCurrency(metaMes)}
                  hint={`realizado ${formatCompactCurrency(realizadoMes)}`}
                  accent="action"
                />
              )}
              {showPipe && (
                <StatTile
                  label="Leads no pipeline"
                  value={totalLeads}
                  hint={`${formatCompactCurrency(emAberto)} em aberto`}
                />
              )}
              {showTasks && (
                <StatTile
                  label="Tarefas"
                  value={totalTasks}
                  hint={`${emAndamento} em andamento · ${concluidas} concluídas`}
                />
              )}
            </div>

            {(showPipe || showTasks) && (
              <div className="grid gap-4 lg:grid-cols-2">
                {showPipe && (
                  <SectionCard
                    title="Pipeline por estágio"
                    summary={`${totalLeads} leads · ${formatCompactCurrency(
                      emAberto,
                    )} em aberto`}
                  >
                    {totalLeads > 0 ? (
                      <PipelineFunnelChart data={funnel} />
                    ) : (
                      <p className="text-ink-muted py-10 text-center text-sm">
                        Nenhum lead em <code>vendas_leads</code>.
                      </p>
                    )}
                  </SectionCard>
                )}

                {showTasks && (
                  <SectionCard
                    title="Tarefas por status"
                    summary={`${totalTasks} no total`}
                  >
                    {totalTasks > 0 ? (
                      <TaskStatusChart data={statusRows} />
                    ) : (
                      <p className="text-ink-muted py-10 text-center text-sm">
                        Nenhuma tarefa em <code>tasks</code>.
                      </p>
                    )}
                  </SectionCard>
                )}
              </div>
            )}

            <p className="text-ink-muted text-xs">
              Mostrando apenas métricas reais. Carga por pessoa, horas da equipe e
              receita acumulada voltam quando esses módulos saírem de dados
              mockados.
            </p>
          </>
        )}
      </div>
    </>
  );
}
