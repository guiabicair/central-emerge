/**
 * Taxa de conversão do funil de vendas por unidade, ao longo do tempo.
 *
 * Fonte: vendas_leads_status_history (migration 0030) — um registro por
 * mudança de estágio de cada lead. A série só existe a partir do dia em
 * que a tabela passou a existir; não há histórico retroativo.
 */

export const FUNNEL_STAGE_ORDER = [
  "novo",
  "contatado",
  "qualificado",
  "virou_proposta",
  "proposta_aprovada",
] as const;

export type FunnelStage = (typeof FUNNEL_STAGE_ORDER)[number];

const STAGE_RANK: Record<FunnelStage, number> = Object.fromEntries(
  FUNNEL_STAGE_ORDER.map((s, i) => [s, i]),
) as Record<FunnelStage, number>;

export interface LeadStatusEvent {
  leadId: number;
  unidade: string;
  status: string;
  changedAt: string;
}

export interface UnitFunnelTrendPoint {
  weekLabel: string;
  weekEnd: string;
  unidade: string;
  counts: Record<FunnelStage, number>;
  /** taxa de conversão relativa a "novo" na mesma semana/unidade (0..1) */
  rates: Record<FunnelStage, number>;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function formatWeekLabel(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Pra cada lead, acha a primeira vez que ele alcançou CADA estágio ou algum
 * posterior (lead que entra direto em "contatado", sem passar por "novo"
 * registrado, conta como tendo alcançado "novo" também — senão a taxa de
 * conversão de estágios depois dele passa de 100%). Pra cada semana, conta
 * quantos leads já tinham alcançado cada estágio até aquele ponto — funil
 * acumulado por coorte, não "quantos estão nesse estágio agora" (que é o
 * que o board já mostra).
 */
export function pipelineFunnelTrend(
  events: LeadStatusEvent[],
): UnitFunnelTrendPoint[] {
  if (events.length === 0) return [];

  // pra cada lead: unidade + o rank mais alto já visto em cada timestamp,
  // reduzido à primeira vez que cada rank (ou maior) foi alcançado.
  const leadUnidade = new Map<number, string>();
  const leadEvents = new Map<number, { rank: number; at: number }[]>();
  for (const ev of events) {
    const rank = STAGE_RANK[ev.status as FunnelStage];
    if (rank === undefined) continue;
    leadUnidade.set(ev.leadId, ev.unidade);
    const at = new Date(ev.changedAt).getTime();
    const list = leadEvents.get(ev.leadId) ?? [];
    list.push({ rank, at });
    leadEvents.set(ev.leadId, list);
  }
  if (leadEvents.size === 0) return [];

  // firstReachedAt[leadId][stageIndex] = primeira vez que o lead teve um
  // evento de rank >= stageIndex.
  const firstReachedAt = new Map<number, number[]>();
  for (const [leadId, evs] of leadEvents) {
    const reached: number[] = FUNNEL_STAGE_ORDER.map(() => Infinity);
    for (const { rank, at } of evs) {
      for (let i = 0; i <= rank; i++) {
        if (at < reached[i]!) reached[i] = at;
      }
    }
    firstReachedAt.set(leadId, reached);
  }

  const leadIds = [...firstReachedAt.keys()];
  const minAt = Math.min(
    ...leadIds.map((id) => Math.min(...firstReachedAt.get(id)!)),
  );
  const now = Date.now();

  const weekEnds: number[] = [];
  for (let end = now; end >= minAt; end -= WEEK_MS) weekEnds.unshift(end);
  if (weekEnds.length === 0 || weekEnds[weekEnds.length - 1] !== now) {
    weekEnds.push(now);
  }

  const unidades = [...new Set(leadUnidade.values())].sort();

  const points: UnitFunnelTrendPoint[] = [];
  for (const weekEnd of weekEnds) {
    for (const unidade of unidades) {
      const idsInUnidade = leadIds.filter((id) => leadUnidade.get(id) === unidade);
      const counts = {} as Record<FunnelStage, number>;
      FUNNEL_STAGE_ORDER.forEach((stage, i) => {
        counts[stage] = idsInUnidade.filter(
          (id) => firstReachedAt.get(id)![i]! <= weekEnd,
        ).length;
      });
      const base = counts.novo;
      const rates = {} as Record<FunnelStage, number>;
      for (const stage of FUNNEL_STAGE_ORDER) {
        rates[stage] = base > 0 ? counts[stage] / base : 0;
      }
      points.push({
        weekLabel: formatWeekLabel(weekEnd),
        weekEnd: new Date(weekEnd).toISOString(),
        unidade,
        counts,
        rates,
      });
    }
  }
  return points;
}
