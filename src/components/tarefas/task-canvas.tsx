"use client";

import { useMemo } from "react";
import { Bot, Plus } from "lucide-react";

import { EntityCanvas } from "@/components/canvas/entity-canvas";
import { Button } from "@/components/ui/button";
import type { TaskRow } from "@/components/tarefas/tasks-board";
import {
  colDot,
  colLabel,
  type StatusCol,
} from "@/app/(app)/tarefas/task-constants";
import type { CanvasSnapshot } from "@/lib/canvas/types";
import { formatDate } from "@/lib/utils";

const COL_W = 300;
const ROW_H = 128;

export function TaskCanvas({
  tasks,
  statuses,
  snapshot,
  canManage,
  onOpenTask,
  onCreateTask,
}: {
  tasks: TaskRow[];
  statuses: StatusCol[];
  snapshot: CanvasSnapshot;
  canManage: boolean;
  onOpenTask: (id: string) => void;
  onCreateTask: () => void;
}) {
  const cols = useMemo(
    () => [...statuses].sort((a, b) => a.position - b.position),
    [statuses],
  );

  const { nodes, fallbackLayout } = useMemo(() => {
    const colIndex = new Map(cols.map((c, i) => [c.name, i]));
    const perCol: Record<string, number> = {};
    const fallbackLayout: Record<string, { x: number; y: number }> = {};

    const nodes = tasks.map((task) => {
      const col = colIndex.get(task.status) ?? 0;
      const row = (perCol[task.status] = (perCol[task.status] ?? 0) + 1) - 1;
      fallbackLayout[task.id] = { x: col * COL_W, y: row * ROW_H };
      const statusCol = cols.find((c) => c.name === task.status);

      return {
        id: task.id,
        body: (
          <div className="w-[224px] rounded-xl border border-white/10 bg-[#141719] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: statusCol ? colDot(statusCol.color) : "var(--ink-muted)",
                }}
              />
              <span className="truncate text-[13px] font-semibold text-[#eef1f0]">
                {task.title}
              </span>
            </div>
            <div className="mt-1 truncate text-[11px] text-[#8b918f]">
              {statusCol ? colLabel(statusCol.name) : task.status}
              {task.clientName ? ` · ${task.clientName}` : ""}
            </div>
            <div className="mt-2 flex items-center justify-between gap-1.5 text-[11px]">
              {task.agentName ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#45f0d1]/12 px-1.5 py-0.5 text-[#45f0d1]">
                  <Bot className="size-3" />
                  {task.agentName}
                </span>
              ) : (
                <span className="text-[#8b918f]">
                  {task.assigneeNames[0] ?? "sem responsável"}
                </span>
              )}
              {task.dueDate && (
                <span className="text-[#8b918f]">{formatDate(task.dueDate)}</span>
              )}
            </div>
          </div>
        ),
      };
    });

    return { nodes, fallbackLayout };
  }, [tasks, cols]);

  return (
    <div className="relative h-full w-full">
      <EntityCanvas
        board="tarefas"
        canManage={canManage}
        nodes={nodes}
        fallbackLayout={fallbackLayout}
        snapshot={snapshot}
        onOpenEntity={onOpenTask}
      />
      {canManage && (
        <div className="absolute top-3 right-3 z-10">
          <Button size="sm" onClick={onCreateTask}>
            <Plus className="size-4" />
            Nova tarefa
          </Button>
        </div>
      )}
    </div>
  );
}
