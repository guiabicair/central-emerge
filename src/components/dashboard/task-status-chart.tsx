"use client";

import { Cell, Label, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { StatusRow } from "@/lib/dashboard";

const config: ChartConfig = { count: { label: "Tarefas" } };

export function TaskStatusChart({ data }: { data: StatusRow[] }) {
  const total = data.reduce((s, r) => s + r.count, 0);
  const rows = data.filter((r) => r.count > 0);

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
      <ChartContainer config={config} className="aspect-square h-[220px] shrink-0">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
          <Pie
            data={rows}
            dataKey="count"
            nameKey="label"
            innerRadius={56}
            outerRadius={84}
            paddingAngle={2}
            strokeWidth={0}
          >
            {rows.map((row) => (
              <Cell key={row.id} fill={row.accent} />
            ))}
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox)) return null;
                const cx = viewBox.cx ?? 0;
                const cy = viewBox.cy ?? 0;
                return (
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan
                      x={cx}
                      y={cy}
                      className="fill-foreground text-2xl font-semibold"
                    >
                      {total}
                    </tspan>
                    <tspan
                      x={cx}
                      y={cy + 20}
                      className="fill-muted-foreground text-xs"
                    >
                      tarefas
                    </tspan>
                  </text>
                );
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-1">
        {data.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: row.accent }}
              />
              <span className="text-muted-foreground">{row.label}</span>
            </span>
            <span className="font-medium">{row.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
