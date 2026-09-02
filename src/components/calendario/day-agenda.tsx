"use client";

import { TaskCard } from "@/components/tarefas/task-card";
import type { Task } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function DayAgenda({
  day,
  tasks,
  onOpenTask,
}: {
  day: Date;
  tasks: Task[];
  onOpenTask: (id: string) => void;
}) {
  return (
    <div className="border-border bg-card flex h-full flex-col rounded-2xl border">
      <div className="border-border border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Agenda do dia</h3>
        <p className="text-muted-foreground text-xs">
          {formatDate(day.toISOString())} · {tasks.length}{" "}
          {tasks.length === 1 ? "tarefa" : "tarefas"}
        </p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {tasks.length === 0 ? (
          <p className="text-muted-foreground px-1 py-6 text-center text-xs">
            Nenhuma tarefa com prazo neste dia.
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
          ))
        )}
      </div>
    </div>
  );
}
