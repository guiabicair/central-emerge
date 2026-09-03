import { Topbar } from "@/components/layout/topbar";
import {
  ProposalsList,
  type ProposalRow,
  type TrafficRow,
} from "@/components/propostas/proposals-list";
import { can } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Propostas · Central Emerge" };

function extractValor(investimento: unknown): number | null {
  if (!investimento || typeof investimento !== "object") return null;
  const o = investimento as Record<string, unknown>;
  for (const k of ["total", "valor", "valor_total", "investimento_total", "preco"]) {
    const n = Number(o[k]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export default async function PropostasPage() {
  const canView = await can("propostas.view");
  if (!canView) {
    return (
      <>
        <Topbar title="Propostas" />
        <div className="flex-1 p-6">
          <div className="border-line bg-surface rounded-2xl border p-6 text-sm">
            Você não tem acesso às propostas.
          </div>
        </div>
      </>
    );
  }

  const supabase = await createClient();
  const [propRes, evRes] = await Promise.all([
    supabase
      .from("propostas")
      .select(
        "id, slug, nome_cliente, nome_exibicao, status, data_proposta, valida_ate, investimento, aprovada_em",
      )
      .order("data_proposta", { ascending: false }),
    supabase
      .from("propostas_events")
      .select("proposta, tipo, created_at"),
  ]);

  const loadError = propRes.error?.message ?? evRes.error?.message ?? null;

  // agrega eventos por slug
  const traffic = new Map<
    string,
    { pageviews: number; clicks: number; last: string }
  >();
  for (const e of evRes.data ?? []) {
    if (!e.proposta) continue;
    const t = traffic.get(e.proposta) ?? {
      pageviews: 0,
      clicks: 0,
      last: e.created_at,
    };
    if (e.tipo === "pageview") t.pageviews += 1;
    if (e.tipo === "click") t.clicks += 1;
    if (e.created_at > t.last) t.last = e.created_at;
    traffic.set(e.proposta, t);
  }

  const proposals: ProposalRow[] = (propRes.data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    cliente: p.nome_cliente,
    exibicao: p.nome_exibicao,
    status: p.status,
    dataProposta: p.data_proposta,
    validaAte: p.valida_ate,
    valor: extractValor(p.investimento),
    ultimaAbertura: traffic.get(p.slug)?.last ?? null,
  }));

  const proposalSlugs = new Set(proposals.map((p) => p.slug));
  const trafficRows: TrafficRow[] = [...traffic.entries()]
    .filter(([slug]) => !proposalSlugs.has(slug))
    .map(([slug, t]) => ({ slug, ...t }))
    .sort((a, b) => b.last.localeCompare(a.last));

  return (
    <>
      <Topbar
        title="Propostas"
        description={
          loadError
            ? "Erro ao carregar — rode a migration 0008"
            : `${proposals.length} propostas · leitura`
        }
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <ProposalsList
          proposals={proposals}
          traffic={trafficRows}
          loadError={loadError}
        />
      </div>
    </>
  );
}
