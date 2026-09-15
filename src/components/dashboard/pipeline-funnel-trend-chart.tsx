"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FunnelStage, UnitFunnelTrendPoint } from "@/lib/pipeline-trend";

const STAGE_LABEL: Record<FunnelStage, string> = {
  novo: "Novo",
  contatado: "Contatado",
  qualificado: "Qualificado",
  virou_proposta: "Virou proposta",
  proposta_aprovada: "Proposta aprovada",
};

const STAGE_ACCENT: Record<FunnelStage, string> = {
  novo: "#a78bfa",
  contatado: "#45f0d1",
  qualificado: "#34d399",
  virou_proposta: "#c9ff3f",
  proposta_aprovada: "#22c55e",
};

/** taxa sobre "novo" — a própria linha de base fica sempre em 100%, então
 * não entra no gráfico (não agrega informação). */
const CHART_STAGES: FunnelStage[] = [
  "contatado",
  "qualificado",
  "virou_proposta",
  "proposta_aprovada",
];

const UNIDADE_LABEL: Record<string, string> = {
  labs: "Emerge Labs",
  tech: "Emerge Tech",
};

const config: ChartConfig = Object.fromEntries(
  CHART_STAGES.map((s) => [s, { label: STAGE_LABEL[s], color: STAGE_ACCENT[s] }]),
);

export function PipelineFunnelTrendChart({
  data,
}: {
  data: UnitFunnelTrendPoint[];
}) {
  const unidades = useMemo(
    () => [...new Set(data.map((p) => p.unidade))].sort(),
    [data],
  );
  const [unidade, setUnidade] = useState(unidades[0] ?? "labs");

  const rows = useMemo(
    () =>
      data
        .filter((p) => p.unidade === unidade)
        .map((p) => {
          const row: Record<string, string | number> = { weekLabel: p.weekLabel };
          for (const stage of CHART_STAGES) {
            row[stage] = Math.round(p.rates[stage] * 1000) / 10;
          }
          return row;
        }),
    [data, unidade],
  );

  if (unidades.length === 0) return null;

  return (
    <div className="space-y-3">
      {unidades.length > 1 && (
        <Tabs value={unidade} onValueChange={setUnidade}>
          <TabsList>
            {unidades.map((u) => (
              <TabsTrigger key={u} value={u}>
                {UNIDADE_LABEL[u] ?? u}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <ChartContainer config={config} className="h-[240px] w-full">
        <LineChart
          accessibilityLayer
          data={rows}
          margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
        >
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="weekLabel"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "#8b918f", fontSize: 11 }}
          />
          <YAxis
            width={40}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#8b918f", fontSize: 11 }}
            tickFormatter={(v: number) => `${v}%`}
            domain={[0, 100]}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <span className="flex w-full justify-between gap-3">
                    <span>{STAGE_LABEL[name as FunnelStage] ?? name}</span>
                    <span className="text-muted-foreground">{value}%</span>
                  </span>
                )}
              />
            }
          />
          {CHART_STAGES.map((stage) => (
            <Line
              key={stage}
              dataKey={stage}
              type="monotone"
              stroke={STAGE_ACCENT[stage]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ChartContainer>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {CHART_STAGES.map((stage) => (
          <li key={stage} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: STAGE_ACCENT[stage] }}
            />
            <span className="text-muted-foreground">{STAGE_LABEL[stage]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
