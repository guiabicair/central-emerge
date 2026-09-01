import { ArrowDownRight, ArrowUpRight, Clock, Wallet } from "lucide-react";

import type { FinanceSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function FinanceSummaryCards({ summary }: { summary: FinanceSummary }) {
  const cards = [
    {
      label: "Caixa atual",
      value: formatCurrency(summary.caixaAtual),
      hint: "Saldo disponível",
      icon: Wallet,
      accent: "#45f0d1",
    },
    {
      label: "A receber",
      value: formatCurrency(summary.aReceber),
      hint: "Faturas em aberto",
      icon: Clock,
      accent: "#fbbf24",
    },
    {
      label: "Receita do mês",
      value: formatCurrency(summary.receitaMes),
      hint: "Entradas confirmadas",
      icon: ArrowUpRight,
      accent: "#34d399",
    },
    {
      label: "Inadimplência",
      value: `${(summary.taxaInadimplencia * 100).toFixed(1)}%`,
      hint: "Sobre o total a receber",
      icon: ArrowDownRight,
      accent: "#f87171",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="border-border bg-card rounded-2xl border p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {card.label}
              </span>
              <span
                className="grid size-7 place-items-center rounded-lg"
                style={{
                  backgroundColor: `${card.accent}1f`,
                  color: card.accent,
                }}
              >
                <Icon className="size-4" />
              </span>
            </div>
            <div className="mt-2 text-xl font-semibold">{card.value}</div>
            <div className="text-muted-foreground mt-0.5 text-xs">
              {card.hint}
            </div>
          </div>
        );
      })}
    </div>
  );
}
