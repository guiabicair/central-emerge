"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { WEEKDAY_LABELS, monthLabel } from "@/lib/calendar";
import { cn } from "@/lib/utils";

export interface DayItem {
  kind: "event" | "task";
  id: string;
  title: string;
  time: string | null;
  color: string;
  meta: string | null;
  href: string | null;
}

function labelFromKey(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return monthLabel(new Date(y, m - 1, 1));
}

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function dayNum(ymd: string) {
  return Number(ymd.slice(8, 10));
}

export function CalendarBoard({
  monthKey,
  gridDays,
  itemsByDay,
  prevM,
  nextM,
  thisM,
  latestMonth,
  showTasksLayer,
}: {
  monthKey: string;
  gridDays: string[];
  itemsByDay: Record<string, DayItem[]>;
  prevM: string;
  nextM: string;
  thisM: string;
  latestMonth: string | null;
  showTasksLayer: boolean;
}) {
  const today = todayYmd();
  const firstOfMonth =
    gridDays.find((d) => d.startsWith(monthKey)) ?? gridDays[0]!;
  const [selected, setSelected] = useState<string>(
    today.startsWith(monthKey) ? today : firstOfMonth,
  );

  const total = useMemo(
    () => Object.values(itemsByDay).reduce((s, a) => s + a.length, 0),
    [itemsByDay],
  );
  const selectedItems = itemsByDay[selected] ?? [];

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-1 flex items-center gap-1">
          <Link
            href={`/calendario?m=${prevM}`}
            className="border-line hover:border-data/40 grid size-8 place-items-center rounded-lg border"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <span className="w-44 text-center text-sm font-semibold">
            {labelFromKey(monthKey)}
          </span>
          <Link
            href={`/calendario?m=${nextM}`}
            className="border-line hover:border-data/40 grid size-8 place-items-center rounded-lg border"
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>

        {monthKey !== thisM && (
          <Link
            href={`/calendario?m=${thisM}`}
            className="border-line hover:border-data/40 inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs"
          >
            <CalendarDays className="size-3.5" />
            Hoje
          </Link>
        )}

        <span className="text-ink-muted ml-auto text-xs">
          {total} {total === 1 ? "item" : "itens"} no mês
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* grade do mês */}
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
            {gridDays.map((d) => {
              const items = itemsByDay[d] ?? [];
              const inMonth = d.startsWith(monthKey);
              const isToday = d === today;
              const isSel = d === selected;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelected(d)}
                  className={cn(
                    "border-line/60 hover:bg-surface-2/50 flex min-h-[92px] flex-col items-start gap-1 border-r border-b p-1.5 text-left transition-colors",
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
                    {dayNum(d)}
                  </span>

                  <div className="mt-auto flex w-full flex-col gap-0.5">
                    {items.slice(0, 3).map((it) => (
                      <span
                        key={it.kind + it.id}
                        className="flex items-center gap-1 truncate text-[10px] leading-tight"
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: it.color }}
                        />
                        <span className="text-ink-muted truncate">
                          {it.time ? `${it.time} ` : ""}
                          {it.title}
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

        {/* agenda do dia selecionado */}
        <div className="border-line bg-surface flex h-[460px] flex-col rounded-2xl border lg:h-auto">
          <div className="border-line border-b px-4 py-3">
            <h3 className="text-sm font-semibold">
              {selected.split("-").reverse().join("/")}
            </h3>
            <p className="text-ink-muted text-xs">
              {selectedItems.length}{" "}
              {selectedItems.length === 1 ? "item" : "itens"}
            </p>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {selectedItems.length === 0 ? (
              <p className="text-ink-muted px-1 py-6 text-center text-xs">
                Nada neste dia.
              </p>
            ) : (
              selectedItems.map((it) => {
                const body = (
                  <div className="border-line hover:border-data/40 rounded-lg border p-2.5 transition-colors">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: it.color }}
                      />
                      <span className="truncate text-sm font-medium">
                        {it.title}
                      </span>
                    </div>
                    <div className="text-ink-muted mt-1 flex items-center gap-2 text-[11px]">
                      {it.time && <span>{it.time}</span>}
                      {it.meta && <span>· {it.meta}</span>}
                    </div>
                  </div>
                );
                return it.href ? (
                  <Link key={it.kind + it.id} href={it.href} className="block">
                    {body}
                  </Link>
                ) : (
                  <div key={it.kind + it.id}>{body}</div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="text-ink-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: "var(--data)" }}
          />
          Evento (calendar_events)
        </span>
        {showTasksLayer && (
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: "var(--action)" }}
            />
            Prazo de tarefa (due_date)
          </span>
        )}
        {!showTasksLayer && (
          <span>Sem acesso a Tarefas — prazos não exibidos.</span>
        )}
      </div>

      {total === 0 && (
        <div className="border-line bg-surface rounded-2xl border p-4 text-sm">
          <p className="font-medium">
            Nada em {labelFromKey(monthKey)}.
          </p>
          <p className="text-ink-muted mt-1">
            {latestMonth && latestMonth !== monthKey ? (
              <>
                Os eventos e prazos existentes vão até{" "}
                <Link
                  href={`/calendario?m=${latestMonth}`}
                  className="text-data-text underline"
                >
                  {labelFromKey(latestMonth)}
                </Link>
                .
              </>
            ) : (
              "Nenhum evento em calendar_events e nenhuma tarefa com prazo neste período."
            )}
          </p>
        </div>
      )}
    </div>
  );
}
