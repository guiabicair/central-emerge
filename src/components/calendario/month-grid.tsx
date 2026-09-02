"use client";

import { PILL_HEX } from "@/components/status-pill";
import { WEEKDAY_LABELS, isSameDay, monthMatrix, ymd } from "@/lib/calendar";
import { PRIORITY_META } from "@/lib/tasks";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MonthGrid({
  month,
  selectedDay,
  tasksByDay,
  onSelectDay,
}: {
  month: Date;
  selectedDay: Date;
  tasksByDay: Map<string, Task[]>;
  onSelectDay: (d: Date) => void;
}) {
  const weeks = monthMatrix(month);
  const today = new Date();

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="border-border grid grid-cols-7 border-b">
        {WEEKDAY_LABELS.map((w) => (
          <div
            key={w}
            className="text-muted-foreground px-2 py-2 text-center text-[11px] font-medium"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => {
          const key = ymd(day);
          const dayTasks = tasksByDay.get(key) ?? [];
          const inMonth = day.getMonth() === month.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDay);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "border-border/60 hover:bg-muted/40 flex min-h-[84px] flex-col items-start gap-1 border-r border-b p-1.5 text-left transition-colors",
                !inMonth && "opacity-40",
                isSelected && "bg-brand/10 hover:bg-brand/10",
              )}
            >
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full text-xs",
                  isToday
                    ? "bg-brand text-[#04231d] font-semibold"
                    : "text-foreground",
                )}
              >
                {day.getDate()}
              </span>

              {dayTasks.length > 0 && (
                <span className="mt-auto flex flex-wrap items-center gap-1">
                  {dayTasks.slice(0, 4).map((t) => (
                    <span
                      key={t.id}
                      className="size-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          PILL_HEX[PRIORITY_META[t.prioridade].color],
                      }}
                    />
                  ))}
                  {dayTasks.length > 4 && (
                    <span className="text-muted-foreground text-[10px]">
                      +{dayTasks.length - 4}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
