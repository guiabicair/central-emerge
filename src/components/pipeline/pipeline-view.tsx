"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { KanbanSquare, Workflow } from "lucide-react";

import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Lead } from "@/lib/types";
import { formatCompactCurrency } from "@/lib/utils";

const PipelineFlow = dynamic(
  () =>
    import("@/components/pipeline/pipeline-flow").then((m) => m.PipelineFlow),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground grid h-full place-items-center text-sm">
        Carregando canvas…
      </div>
    ),
  },
);

type PipelineViewMode = "board" | "flow";

export function PipelineView({ leads }: { leads: Lead[] }) {
  const [mode, setMode] = useState<PipelineViewMode>("board");

  const stats = useMemo(() => {
    const abertos = leads.filter(
      (l) => l.stage !== "fechado" && l.stage !== "perdido",
    );
    const fechados = leads.filter((l) => l.stage === "fechado");
    const perdidos = leads.filter((l) => l.stage === "perdido");
    const decididos = fechados.length + perdidos.length;

    return [
      {
        label: "Em aberto",
        value: `${abertos.length} leads`,
        hint: formatCompactCurrency(abertos.reduce((s, l) => s + l.valor, 0)),
      },
      {
        label: "Fechados",
        value: `${fechados.length}`,
        hint: formatCompactCurrency(fechados.reduce((s, l) => s + l.valor, 0)),
      },
      {
        label: "Perdidos",
        value: `${perdidos.length}`,
        hint: formatCompactCurrency(perdidos.reduce((s, l) => s + l.valor, 0)),
      },
      {
        label: "Taxa de fechamento",
        value: decididos
          ? `${Math.round((fechados.length / decididos) * 100)}%`
          : "—",
        hint: `${decididos} decididos`,
      },
    ];
  }, [leads]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="border-border bg-card rounded-lg border px-3 py-2"
            >
              <div className="text-muted-foreground text-[11px]">{s.label}</div>
              <div className="text-sm font-semibold">{s.value}</div>
              <div className="text-muted-foreground text-[11px]">{s.hint}</div>
            </div>
          ))}
        </div>

        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as PipelineViewMode)}
        >
          <TabsList>
            <TabsTrigger value="board">
              <KanbanSquare className="size-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="flow">
              <Workflow className="size-4" />
              Nós
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/*
        Uma unica view por vez fica no DOM — evita o bug de os dois paineis
        renderizarem juntos e garante que a view ativa herde a altura toda
        (essencial pro React Flow, que mede o container pai).
      */}
      <div className="min-h-0 flex-1">
        {mode === "board" ? (
          <KanbanBoard leads={leads} />
        ) : (
          <div className="border-border h-full border-t">
            <PipelineFlow leads={leads} />
          </div>
        )}
      </div>
    </div>
  );
}
