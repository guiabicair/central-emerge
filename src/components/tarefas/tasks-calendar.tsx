"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import type { TaskRow } from "@/components/tarefas/tasks-board";
import { colDot, type StatusCol } from "@/app/(app)/tarefas/task-constants";
import { Button } from "@/components/ui/button";
import {
  WEEKDAY_LABELS,
  addMonths,
  brtParts,
  isSameDay,
  monthLabel,
  monthMatrix,
  startOfMonth,
  ymd,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

export function TasksCalendar({
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

  // due_date -> dia BRT (BUG#9)
  const byDay = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const day = brtParts(t.dueDate).day;
      const arr = map.get(day) ?? [];
      arr.push(t);
      map.set(day, arr);
    }
    return map;
  }, [tasks]);

  // mês inicial = o que tem mais tarefas com prazo
  const initialMonth = useMemo(() => {
    const perMonth = new Map<string, number>();
    for (const day of byDay.keys()) {
      const m = day.slice(0, 7);
      perMonth.set(m, (perMonth.get(m) ?? 0) + (byDay.get(day)?.length ?? 0));
    }
    let best: string | null = null;
    let bestN = 0;
    for (const [m, n] of perMonth) if (n > bestN) [best, bestN] = [m, n];
    if (!best) return startOfMonth(new Date());
    const [y, mo] = best.split("-").map(Number);
    return new Date(y, mo - 1, 1);
  }, [byDay]);

  const [month, setMonth] = useState<Date>(initialMonth);
  const [sel, setSel] = useState<string>(() => ymd(new Date()));

  const weeks = monthMatrix(month);
  const today = new Date();
  const selItems = byDay.get(sel) ?? [];

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-1 flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="w-44 text-center text-sm font-semibold">
            {monthLabel(month)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => {
            const now = new Date();
            setMonth(startOfMonth(now));
            setSel(ymd(now));
          }}
        >
          <CalendarDays className="size-3.5" />
          Hoje
        </Button>
        <span className="text-ink-muted ml-auto text-xs">
          {tasks.filter((t) => t.dueDate).length} com prazo
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="border-line bg-surface overflow-hidden rounded-2xl border">
          <div className="border-line grid grid-cols-7 border-b">
            {WEEKDAY_LABELS.map((w) => (
              <div
                key={w}
                className="text-ink-muted px-2 py-2 text-center text-[11px] font-medium"
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {weeks.flat().map((day) => {
              const key = ymd(day);
              const items = byDay.get(key) ?? [];
              const inMonth = day.getMonth() === month.getMonth();
              const isToday = isSameDay(day, today);
              const isSel = key === sel;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSel(key)}
                  className={cn(
                    "border-line/60 hover:bg-surface-2/50 flex min-h-[88px] flex-col items-start gap-1 border-r border-b p-1.5 text-left transition-colors",
                    !inMonth && "opacity-40",
                    isSel && "bg-data/10 hover:bg-data/10",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-xs",
                      isToday
                        ? "bg-data text-on-data font-semibold"
                        : "text-ink",
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <div className="mt-auto flex w-full flex-col gap-0.5">
                    {items.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className="flex items-center gap-1 truncate text-[10px] leading-tight"
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: colorOf(t.status) }}
                        />
                        <span className="text-ink-muted truncate">
                          {t.title}
                        </span>
                      </span>
                    ))}
                    {items.length > 3 && (
                      <span className="text-ink-muted text-[10px]">
                        +{items.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-line bg-surface flex h-[420px] flex-col rounded-2xl border lg:h-auto">
          <div className="border-line border-b px-4 py-3">
            <h3 className="text-sm font-semibold">
              {sel.split("-").reverse().join("/")}
            </h3>
            <p className="text-ink-muted text-xs">
              {selItems.length}{" "}
              {selItems.length === 1 ? "tarefa" : "tarefas"}
            </p>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {selItems.length === 0 ? (
              <p className="text-ink-muted px-1 py-6 text-center text-xs">
                Nenhuma tarefa com prazo neste dia.
              </p>
            ) : (
              selItems.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onOpenTask(t)}
                  className="border-line hover:border-data/40 block w-full rounded-lg border p-2.5 text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: colorOf(t.status) }}
                    />
                    <span className="truncate text-sm font-medium">
                      {t.title}
                    </span>
                  </div>
                  {t.clientName && (
                    <div className="text-ink-muted mt-1 text-[11px]">
                      {t.clientName}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
