"use client";

import type { FC } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TeamHoursRow } from "@/lib/dashboard";

const config: ChartConfig = { horas: { label: "Horas" } };

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: TeamHoursRow;
}

const HoursBar: FC<BarShapeProps> = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload,
}) => (
  <rect
    x={x}
    y={y}
    width={width}
    height={Math.max(height, 0)}
    rx={5}
    ry={5}
    fill={payload?.cor ?? "#45f0d1"}
    fillOpacity={0.9}
  />
);

export function TeamHoursChart({ data }: { data: TeamHoursRow[] }) {
  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
      >
        <XAxis
          dataKey="primeiroNome"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: "#8b918f", fontSize: 11 }}
        />
        <YAxis
          width={28}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#8b918f", fontSize: 11 }}
        />
        <ChartTooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          content={
            <ChartTooltipContent formatter={(value) => `${value}h na semana`} />
          }
        />
        <Bar
          dataKey="horas"
          barSize={40}
          isAnimationActive={false}
          shape={<HoursBar />}
        />
      </BarChart>
    </ChartContainer>
  );
}
