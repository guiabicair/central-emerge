import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { TeamHoursRow } from "@/lib/dashboard";
import { initials } from "@/lib/utils";

export function TeamLoadStrip({ rows }: { rows: TeamHoursRow[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {rows.map((row) => (
        <div
          key={row.id}
          className="border-border bg-card rounded-xl border p-3"
        >
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarFallback
                className="text-[10px] font-semibold"
                style={{ backgroundColor: `${row.cor}22`, color: row.cor }}
              >
                {initials(row.nome)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">{row.nome}</span>
          </div>
          <div className="mt-2.5 flex items-end justify-between text-xs">
            <div>
              <div className="text-foreground text-base font-semibold">
                {row.ativas}
              </div>
              <div className="text-muted-foreground text-[11px]">ativas</div>
            </div>
            <div>
              <div
                className="text-base font-semibold"
                style={{ color: row.atrasadas > 0 ? "#f87171" : undefined }}
              >
                {row.atrasadas}
              </div>
              <div className="text-muted-foreground text-[11px]">atrasadas</div>
            </div>
            <div className="text-right">
              <div className="text-foreground text-base font-semibold">
                {row.horas.toLocaleString("pt-BR", {
                  maximumFractionDigits: 1,
                })}
                h
              </div>
              <div className="text-muted-foreground text-[11px]">na semana</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
