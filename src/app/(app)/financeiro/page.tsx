import { Topbar } from "@/components/layout/topbar";
import { FinanceView } from "@/components/financeiro/finance-view";
import { can } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Financeiro · Central Emerge" };

function ym(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const now = new Date();
  const periodo = ym(now);

  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    months.push(ym(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  const windowStart = `${months[0]}-01`;

  const seedRes = await supabase
    .from("clients")
    .select("id, name")
    .eq("is_seed", true);

  const seedIds = (seedRes.data ?? []).map((c) => c.id);
  const clientName = new Map((seedRes.data ?? []).map((c) => [c.id, c.name]));

  const [cashRes, canView, canManage, recurringRes, specificRes, expRes, metaRes] =
    await Promise.all([
      supabase
        .from("company_cash")
        .select("id, current_amount, description, updated_by, updated_at")
        .order("updated_at", { ascending: false })
        .limit(60),
      can("financeiro.view"),
      can("financeiro.manage"),
      seedIds.length
        ? supabase
            .from("recurring_projects")
            .select("id, title, monthly_amount, start_date, end_date, client_id")
            .eq("status", "active")
            .in("client_id", seedIds)
        : Promise.resolve({ data: [], error: null } as const),
      seedIds.length
        ? supabase
            .from("specific_projects")
            .select("id, title, paid_amount, total_amount, payment_date, status, client_id")
            .in("client_id", seedIds)
        : Promise.resolve({ data: [], error: null } as const),
      supabase
        .from("expenses")
        .select("id, title, amount, category, date")
        .gte("date", windowStart)
        .order("date", { ascending: false }),
      supabase
        .from("vendas_metas")
        .select("id, frente, meta_valor, realizado_valor, meta_status")
        .eq("periodo", periodo),
    ]);

  const loadError =
    seedRes.error?.message ?? cashRes.error?.message ?? metaRes.error?.message ?? null;

  // nomes de quem ajustou o caixa
  const updaterIds = [
    ...new Set((cashRes.data ?? []).map((r) => r.updated_by).filter(Boolean)),
  ];
  const updaterName = new Map<string, string>();
  if (updaterIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", updaterIds);
    for (const p of profs ?? [])
      updaterName.set(p.user_id, p.full_name ?? "—");
  }

  const recurring = (recurringRes.data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    monthlyAmount: Number(r.monthly_amount) || 0,
    startDate: r.start_date,
    endDate: (r as { end_date?: string | null }).end_date ?? null,
    clientName: clientName.get(r.client_id ?? "") ?? "—",
  }));
  const mrr = recurring.reduce((s, r) => s + r.monthlyAmount, 0);

  const specificByMonth = new Map<string, number>();
  for (const s of specificRes.data ?? []) {
    if (!s.payment_date) continue;
    const m = s.payment_date.slice(0, 7);
    const v = Number(s.paid_amount) || Number(s.total_amount) || 0;
    specificByMonth.set(m, (specificByMonth.get(m) ?? 0) + v);
  }
  const expensesByMonth = new Map<string, number>();
  for (const e of expRes.data ?? []) {
    const m = e.date.slice(0, 7);
    expensesByMonth.set(m, (expensesByMonth.get(m) ?? 0) + (Number(e.amount) || 0));
  }

  const lastDayOf = (m: string) =>
    new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0)
      .toISOString()
      .slice(0, 10);

  // entrada recorrente reconhecida no mês = contratos ativos naquele mês
  // (start_date <= fim do mês e sem fim antes do começo). Nada de MRR "chapado".
  const chart = months.map((m) => {
    const monthEnd = lastDayOf(m);
    const monthStart = `${m}-01`;
    const recorrenteMes = recurring
      .filter(
        (r) =>
          r.startDate <= monthEnd &&
          (!r.endDate || r.endDate >= monthStart),
      )
      .reduce((s, r) => s + r.monthlyAmount, 0);
    return {
      mes: m.slice(5) + "/" + m.slice(2, 4),
      entradas: recorrenteMes + (specificByMonth.get(m) ?? 0),
      saidas: expensesByMonth.get(m) ?? 0,
    };
  });
  const chartHasData =
    chart.some((d) => d.saidas > 0) ||
    chart.filter((d) => d.entradas > 0).length >= 2;

  const cashHistory = (cashRes.data ?? []).map((r) => ({
    id: r.id,
    amount: Number(r.current_amount) || 0,
    description: r.description,
    who: updaterName.get(r.updated_by) ?? "—",
    when: r.updated_at,
  }));
  const caixaHoje = cashHistory[0]?.amount ?? null;

  const metaValor = (metaRes.data ?? []).reduce(
    (s, r) => s + (Number(r.meta_valor) || 0),
    0,
  );
  const metaRealizado = (metaRes.data ?? []).reduce(
    (s, r) => s + (Number(r.realizado_valor) || 0),
    0,
  );
  // referência (não é o realizado da meta): entradas da empresa no mês corrente
  const entradasMes =
    (chart.at(-1)?.entradas ?? 0);

  return (
    <>
      <Topbar
        title="Financeiro"
        description={
          loadError ? "Erro ao carregar — rode as migrations 0003–0005" : "Caixa, MRR e meta do mês"
        }
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <FinanceView
          loadError={loadError}
          canView={canView}
          canManage={canManage}
          caixaHoje={caixaHoje}
          mrr={mrr}
          meta={
            (metaRes.data ?? []).length
              ? {
                  valor: metaValor,
                  realizado: metaRealizado,
                  entradasMes,
                  status: (metaRes.data ?? [])[0]?.meta_status ?? "draft",
                  frentes: (metaRes.data ?? []).map((r) => ({
                    frente: r.frente,
                    meta: Number(r.meta_valor) || 0,
                    realizado: Number(r.realizado_valor) || 0,
                  })),
                }
              : null
          }
          chart={chart}
          chartHasData={chartHasData}
          recurring={recurring}
          cashHistory={cashHistory}
          periodo={periodo}
        />
      </div>
    </>
  );
}
