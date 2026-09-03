import { PipelineFunnelChart } from "@/components/dashboard/pipeline-funnel-chart";
import { RevenueAreaChart } from "@/components/dashboard/revenue-area-chart";
import { SectionCard } from "@/components/dashboard/section-card";
import { TaskStatusChart } from "@/components/dashboard/task-status-chart";
import { TeamHoursChart } from "@/components/dashboard/team-hours-chart";
import { TeamLoadStrip } from "@/components/dashboard/team-load-strip";
import { Topbar } from "@/components/layout/topbar";
import { StatTile } from "@/components/stat-tile";
import {
  pipelineEmAberto,
  pipelineFunnel,
  revenueSeries,
  taskCompletion,
  taskStatusBreakdown,
  taxaFechamento,
  teamHours,
} from "@/lib/dashboard";
import {
  FINANCE_SUMMARY,
  LEADS,
  TASKS,
  TEAM,
  TRANSACTIONS,
} from "@/lib/mock-data";
import { isAtiva, isAtrasada } from "@/lib/tasks";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

export const metadata = { title: "Dashboard · Central Emerge" };

export default function DashboardPage() {
  const funnel = pipelineFunnel(LEADS);
  const emAberto = pipelineEmAberto(LEADS);
  const taxa = taxaFechamento(LEADS);
  const statusRows = taskStatusBreakdown(TASKS);
  const revenue = revenueSeries(TRANSACTIONS);
  const hours = teamHours(TASKS, TEAM);
  const completion = taskCompletion(TASKS);

  const tarefasAtivas = TASKS.filter(isAtiva).length;
  const tarefasAtrasadas = TASKS.filter(isAtrasada).length;
  const saldoAtual = revenue.at(-1)?.saldo ?? 0;
  const emProducao =
    statusRows.find((s) => s.id === "em-producao")?.count ?? 0;
  const negociosAbertos = LEADS.filter(
    (l) => l.stage !== "fechado" && l.stage !== "perdido",
  ).length;

  return (
    <>
      <Topbar
        title="Dashboard"
        description="Visão consolidada — pipeline, tarefas, clientes e financeiro"
      />

      <div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          <StatTile
            label="Leads no pipeline"
            value={LEADS.length}
            hint={`${formatCompactCurrency(emAberto)} em aberto`}
          />
          <StatTile
            label="Taxa de fechamento"
            value={`${Math.round(taxa * 100)}%`}
            hint="fechados / decididos"
            accent="data"
          />
          <StatTile
            label="Tarefas ativas"
            value={tarefasAtivas}
            hint={`${emProducao} em produção`}
          />
          <StatTile
            label="Tarefas atrasadas"
            value={tarefasAtrasadas}
            hint="prazo vencido"
            accent={tarefasAtrasadas > 0 ? "gap" : undefined}
          />
          <StatTile
            label="Caixa atual"
            value={formatCurrency(FINANCE_SUMMARY.caixaAtual)}
            hint={`${formatCompactCurrency(FINANCE_SUMMARY.aReceber)} a receber`}
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="border-border bg-card rounded-xl border p-4">
            <div className="text-muted-foreground text-[11px]">
              Conclusão de subtarefas
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-brand text-2xl font-semibold">
                {Math.round(completion.pct * 100)}%
              </span>
              <span className="text-muted-foreground text-xs">
                {completion.done}/{completion.total}
              </span>
            </div>
            <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-brand h-full rounded-full"
                style={{ width: `${completion.pct * 100}%` }}
              />
            </div>
          </div>
          <div className="border-border bg-card rounded-xl border p-4">
            <div className="text-muted-foreground text-[11px]">
              Pipeline em aberto
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {formatCompactCurrency(emAberto)}
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              {negociosAbertos} negócios em andamento
            </div>
          </div>
          <div className="border-border bg-card rounded-xl border p-4">
            <div className="text-muted-foreground text-[11px]">
              Saldo do período
            </div>
            <div
              className="mt-1 text-2xl font-semibold"
              style={{ color: saldoAtual >= 0 ? "#34d399" : "#f87171" }}
            >
              {formatCompactCurrency(saldoAtual)}
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              acumulado nas transações recentes
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Carga por pessoa</h3>
          <TeamLoadStrip rows={hours} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard
            title="Funil do pipeline"
            summary={`${formatCompactCurrency(emAberto)} em aberto`}
          >
            <PipelineFunnelChart data={funnel} />
          </SectionCard>

          <SectionCard
            title="Tarefas por status"
            summary={`${TASKS.length} no total`}
          >
            <TaskStatusChart data={statusRows} />
          </SectionCard>

          <SectionCard
            title="Receita — saldo acumulado"
            summary={formatCompactCurrency(saldoAtual)}
          >
            <RevenueAreaChart data={revenue} />
          </SectionCard>

          <SectionCard
            title="Horas da equipe na semana"
            summary={`${hours
              .reduce((s, r) => s + r.horas, 0)
              .toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h no total`}
          >
            <TeamHoursChart data={hours} />
          </SectionCard>
        </div>
      </div>
    </>
  );
}
