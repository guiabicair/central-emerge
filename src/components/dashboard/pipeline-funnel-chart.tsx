"use client";

import type { FC } from "react";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { FunnelRow } from "@/lib/dashboard";
import { formatCompactCurrency } from "@/lib/utils";

const config: ChartConfig = {
  count: { label: "Leads" },
};

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: FunnelRow;
}

const FunnelBar: FC<BarShapeProps> = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload,
}) => (
  <rect
    x={x}
    y={y}
    width={Math.max(width, 0)}
    height={height}
    rx={5}
    ry={5}
    fill={payload?.accent ?? "#45f0d1"}
  />
);

export function PipelineFunnelChart({ data }: { data: FunnelRow[] }) {
  return (
    <ChartContainer config={config} className="h-[280px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 48, top: 4, bottom: 4 }}
      >
        <YAxis
          type="category"
          dataKey="label"
          width={82}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#8b918f", fontSize: 11 }}
        />
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <ChartTooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <span className="flex w-full justify-between gap-3">
                  <span>{value} leads</span>
                  <span className="text-muted-foreground">
                    {formatCompactCurrency(
                      (item?.payload as FunnelRow)?.valor ?? 0,
                    )}
                  </span>
                </span>
              )}
            />
          }
        />
        <Bar
          dataKey="count"
          barSize={22}
          isAnimationActive={false}
          shape={<FunnelBar />}
        >
          <LabelList
            dataKey="valor"
            position="right"
            formatter={(v: unknown) => formatCompactCurrency(Number(v) || 0)}
            className="fill-muted-foreground"
            fontSize={10}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
