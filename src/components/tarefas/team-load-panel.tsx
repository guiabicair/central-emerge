import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TEAM } from "@/lib/mock-data";
import { horasNaSemana, isAtiva, isAtrasada } from "@/lib/tasks";
import type { Task } from "@/lib/types";

export function TeamLoadPanel({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 px-4 pt-4 md:grid-cols-4 md:px-6">
      {TEAM.map((member) => {
        const suas = tasks.filter((t) => t.responsavelId === member.id);
        const ativas = suas.filter(isAtiva).length;
        const atrasadas = suas.filter(isAtrasada).length;
        const horas = suas.reduce(
          (s, t) => s + horasNaSemana(t, member.id),
          0,
        );

        return (
          <div
            key={member.id}
            className="border-border bg-card rounded-xl border p-3"
          >
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarFallback
                  className="text-[10px] font-semibold"
                  style={{
                    backgroundColor: `${member.cor}22`,
                    color: member.cor,
                  }}
                >
                  {member.iniciais}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm font-medium">{member.nome}</span>
            </div>
            <div className="mt-2.5 flex items-end justify-between text-xs">
              <div>
                <div className="text-foreground text-base font-semibold">
                  {ativas}
                </div>
                <div className="text-muted-foreground text-[11px]">ativas</div>
              </div>
              <div>
                <div
                  className="text-base font-semibold"
                  style={{ color: atrasadas > 0 ? "#f87171" : undefined }}
                >
                  {atrasadas}
                </div>
                <div className="text-muted-foreground text-[11px]">
                  atrasadas
                </div>
              </div>
              <div className="text-right">
                <div className="text-foreground text-base font-semibold">
                  {horas.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h
                </div>
                <div className="text-muted-foreground text-[11px]">
                  na semana
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
