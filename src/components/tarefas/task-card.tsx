import { GitBranch, ListChecks, MessageSquare } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CLIENTS_BY_ID, TEAM_BY_ID } from "@/lib/mock-data";
import { PRIORITY_META, isAtrasada, subtaskProgress } from "@/lib/tasks";
import type { Task } from "@/lib/types";
import { cn, dueLabel } from "@/lib/utils";

export function TaskCard({
  task,
  onOpen,
}: {
  task: Task;
  onOpen: (id: string) => void;
}) {
  const person = TEAM_BY_ID[task.responsavelId];
  const cliente = task.clienteId ? CLIENTS_BY_ID[task.clienteId] : undefined;
  const priority = PRIORITY_META[task.prioridade];
  const late = isAtrasada(task);
  const sub = subtaskProgress(task);

  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      className="group border-border bg-card hover:border-brand/40 w-full rounded-xl border p-3 text-left transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold">{task.titulo}</h4>
        <StatusPill color={priority.color}>{priority.label}</StatusPill>
      </div>

      <div className="text-muted-foreground mt-1.5 text-xs">
        {cliente ? cliente.empresa : "Sem cliente"} · {task.categoria}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarFallback
              className="text-[10px] font-semibold"
              style={{
                backgroundColor: `${person?.cor ?? "#8b918f"}22`,
                color: person?.cor ?? "#8b918f",
              }}
            >
              {person?.iniciais ?? "--"}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "text-[11px]",
              late ? "text-[#f87171]" : "text-muted-foreground",
            )}
          >
            {dueLabel(task.prazo)}
          </span>
        </div>

        <div className="text-muted-foreground flex items-center gap-2.5 text-[11px]">
          {task.dependsOn.length > 0 && (
            <span className="flex items-center gap-1" title="Depende de outras tarefas">
              <GitBranch className="size-3" />
              {task.dependsOn.length}
            </span>
          )}
          {sub.total > 0 && (
            <span className="flex items-center gap-1" title="Subtarefas concluídas">
              <ListChecks className="size-3" />
              {sub.done}/{sub.total}
            </span>
          )}
          {task.comentarios.length > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3" />
              {task.comentarios.length}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
