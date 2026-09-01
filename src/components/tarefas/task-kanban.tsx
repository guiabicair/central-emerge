"use client";

import { Plus } from "lucide-react";

import { TaskCard } from "@/components/tarefas/task-card";
import type { Task, TaskColumn } from "@/lib/types";

export function TaskKanban({
  tasks,
  columns,
  onOpenTask,
  onAddColumn,
}: {
  tasks: Task[];
  columns: TaskColumn[];
  onOpenTask: (id: string) => void;
  onAddColumn: () => void;
}) {
  return (
    <div className="flex h-full gap-4 overflow-x-auto px-4 pt-1 pb-4 md:px-6">
      {columns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);
        return (
          <section
            key={column.id}
            className="flex h-full w-[290px] shrink-0 flex-col"
          >
            <header className="mb-3 flex items-center gap-2 px-1">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: column.accent }}
              />
              <h3 className="text-sm font-semibold">{column.label}</h3>
              <span className="text-muted-foreground bg-muted rounded-full px-1.5 text-[11px] font-medium">
                {columnTasks.length}
              </span>
              {column.custom && (
                <span className="text-muted-foreground text-[10px]">custom</span>
              )}
            </header>

            <div className="bg-muted/30 flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl p-2">
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
              ))}
              {columnTasks.length === 0 && (
                <p className="text-muted-foreground px-2 py-6 text-center text-xs">
                  Nada aqui
                </p>
              )}
            </div>
          </section>
        );
      })}

      <button
        type="button"
        onClick={onAddColumn}
        className="text-muted-foreground hover:border-brand/40 hover:text-foreground flex h-10 w-[220px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/12 text-xs transition-colors"
      >
        <Plus className="size-3.5" />
        Nova Coluna
      </button>
    </div>
  );
}
