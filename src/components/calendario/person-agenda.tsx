"use client";

import { TaskCard } from "@/components/tarefas/task-card";
import { ymd } from "@/lib/calendar";
import type { Task } from "@/lib/types";
import { dueLabel, formatDate } from "@/lib/utils";

export function PersonAgenda({
  pessoaNome,
  tasks,
  onOpenTask,
}: {
  pessoaNome: string;
  tasks: Task[];
  onOpenTask: (id: string) => void;
}) {
  const ordered = [...tasks].sort((a, b) => a.prazo.localeCompare(b.prazo));

  const groups: { dia: string; tasks: Task[] }[] = [];
  for (const t of ordered) {
    const dia = ymd(new Date(t.prazo));
    const last = groups.at(-1);
    if (last && last.dia === dia) last.tasks.push(t);
    else groups.push({ dia, tasks: [t] });
  }

  return (
    <div className="border-border bg-card rounded-2xl border p-4">
      <h3 className="text-sm font-semibold">
        Agenda de {pessoaNome}{" "}
        <span className="text-muted-foreground font-normal">
          · {tasks.length} tarefas na fila
        </span>
      </h3>

      {groups.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-xs">
          Sem tarefas para esta pessoa com os filtros atuais.
        </p>
      ) : (
        <div className="mt-3 space-y-4">
          {groups.map((g) => (
            <div key={g.dia}>
              <div className="text-muted-foreground mb-1.5 flex items-baseline gap-2 text-xs">
                <span className="text-foreground font-medium">
                  {formatDate(`${g.dia}T12:00:00`)}
                </span>
                <span>{dueLabel(`${g.dia}T12:00:00`)}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {g.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
