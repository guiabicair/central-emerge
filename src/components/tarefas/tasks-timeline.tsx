"use client";

import { useMemo } from "react";

import type { TaskRow } from "@/components/tarefas/tasks-board";
import {
  PRIORITY_META,
  colDot,
  type StatusCol,
} from "@/app/(app)/tarefas/task-constants";
import { StatusPill, type PillColor } from "@/components/status-pill";
import { brtParts } from "@/lib/calendar";

function humanDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const s = dt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    weekday: "short",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function TasksTimeline({
  tasks,
  statuses,
  onOpenTask,
}: {
  tasks: TaskRow[];
  statuses: StatusCol[];
  onOpenTask: (t: TaskRow) => void;
}) {
  const colorOf = useMemo(() => {
    const m = new Map<string, string>();
    statuses.forEach((s) => m.set(s.name, s.color));
    return (name: string) => colDot(m.get(name) ?? "slate");
  }, [statuses]);

  const { columns, undated } = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    const undated: TaskRow[] = [];
    for (const t of tasks) {
      if (!t.dueDate) {
        undated.push(t);
        continue;
      }
      const day = brtParts(t.dueDate).day;
      const arr = map.get(day) ?? [];
      arr.push(t);
      map.set(day, arr);
    }
    const columns = [...map.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    return { columns, undated };
  }, [tasks]);

  const todayIso = brtParts(new Date().toISOString()).day;

  if (columns.length === 0 && undated.length === 0) {
    return (
      <div className="text-ink-muted flex-1 p-10 text-center text-sm">
        Nenhuma tarefa.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto p-4 md:p-6">
      <div className="flex min-w-max gap-3">
        {columns.map(([day, items]) => {
          const past = day < todayIso;
          return (
            <div key={day} className="w-[220px] shrink-0">
              <div className="mb-2 flex items-center gap-2 px-1">
                <span
                  className={`h-2 w-2 rounded-full ${
                    day === todayIso
                      ? "bg-data"
                      : past
                        ? "bg-gap"
                        : "bg-ink-muted"
                  }`}
                />
                <span className="text-xs font-semibold">{humanDay(day)}</span>
                <span className="bg-surface-2 text-ink-muted rounded-full px-1.5 text-[11px]">
                  {items.length}
                </span>
              </div>
              <div className="border-line/60 flex flex-col gap-2 border-l pl-3">
                {items.map((t) => {
                  const prio =
                    PRIORITY_META[t.priority] ?? PRIORITY_META.medium;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onOpenTask(t)}
                      className="border-line bg-surface hover:border-data/40 rounded-lg border p-2.5 text-left transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: colorOf(t.status) }}
                        />
                        <span className="truncate text-[13px] font-medium">
                          {t.title}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <StatusPill color={prio.color as PillColor}>
                          {prio.label}
                        </StatusPill>
                        {t.clientName && (
                          <span className="text-ink-muted truncate text-[11px]">
                            {t.clientName}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {undated.length > 0 && (
          <div className="w-[220px] shrink-0">
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className="bg-ink-muted h-2 w-2 rounded-full" />
              <span className="text-xs font-semibold">Sem prazo</span>
              <span className="bg-surface-2 text-ink-muted rounded-full px-1.5 text-[11px]">
                {undated.length}
              </span>
            </div>
            <div className="border-line/60 flex flex-col gap-2 border-l pl-3">
              {undated.map((t) => {
                const prio = PRIORITY_META[t.priority] ?? PRIORITY_META.medium;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onOpenTask(t)}
                    className="border-line bg-surface hover:border-data/40 rounded-lg border p-2.5 text-left transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: colorOf(t.status) }}
                      />
                      <span className="truncate text-[13px] font-medium">
                        {t.title}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <StatusPill color={prio.color as PillColor}>
                        {prio.label}
                      </StatusPill>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
