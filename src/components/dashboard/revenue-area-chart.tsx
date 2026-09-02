"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { RevenuePoint } from "@/lib/dashboard";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

const config: ChartConfig = {
  saldo: { label: "Saldo acumulado", color: "#45f0d1" },
};

const GRAD_ID = "revenue-saldo-gradient";

export function RevenueAreaChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
      >
        <defs>
          <linearGradient id={GRAD_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#45f0d1" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#45f0d1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: "#8b918f", fontSize: 11 }}
        />
        <YAxis
          width={48}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#8b918f", fontSize: 11 }}
          tickFormatter={(v: number) => formatCompactCurrency(v)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatCurrency(Number(value))}
            />
          }
        />
        <Area
          dataKey="saldo"
          type="monotone"
          stroke="#45f0d1"
          strokeWidth={2}
          fill={`url(#${GRAD_ID})`}
          fillOpacity={1}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
