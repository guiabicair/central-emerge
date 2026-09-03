"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

const config: ChartConfig = {
  entradas: { label: "Entradas", color: "var(--data)" },
  saidas: { label: "Saídas", color: "var(--gap)" },
};

export function FinanceChart({
  data,
}: {
  data: { mes: string; entradas: number; saidas: number }[];
}) {
  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
        barGap={2}
      >
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis
          dataKey="mes"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
        />
        <YAxis
          width={52}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
          tickFormatter={(v: number) => formatCompactCurrency(v)}
        />
        <ChartTooltip
          cursor={{ fill: "color-mix(in oklab, var(--ink) 5%, transparent)" }}
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span className="flex w-full justify-between gap-3">
                  <span className="text-ink-muted capitalize">{name}</span>
                  <span>{formatCurrency(Number(value))}</span>
                </span>
              )}
            />
          }
        />
        <Bar
          dataKey="entradas"
          fill="var(--data)"
          radius={4}
          isAnimationActive={false}
        />
        <Bar
          dataKey="saidas"
          fill="var(--gap)"
          radius={4}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  );
}
