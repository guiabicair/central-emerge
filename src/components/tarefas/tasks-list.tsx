"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import type { TaskRow } from "@/components/tarefas/tasks-board";
import { StatusPill, type PillColor } from "@/components/status-pill";
import {
  PRIORITY_META,
  colDot,
  colLabel,
  type StatusCol,
} from "@/app/(app)/tarefas/task-constants";
import { formatDate } from "@/lib/utils";

type SortKey =
  | "title"
  | "clientName"
  | "assignee"
  | "dueDate"
  | "status"
  | "priority";

const PRIO_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function TasksList({
  tasks,
  statuses,
  onOpenTask,
}: {
  tasks: TaskRow[];
  statuses: StatusCol[];
  onOpenTask: (t: TaskRow) => void;
}) {
  const [sort, setSort] = useState<SortKey>("dueDate");
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const statusPos = useMemo(() => {
    const m = new Map<string, number>();
    statuses.forEach((s) => m.set(s.name, s.position));
    return m;
  }, [statuses]);

  const rows = useMemo(() => {
    const val = (t: TaskRow): string | number => {
      switch (sort) {
        case "title":
          return t.title.toLowerCase();
        case "clientName":
          return (t.clientName ?? "~").toLowerCase();
        case "assignee":
          return (t.assigneeNames[0] ?? "~").toLowerCase();
        case "dueDate":
          return t.dueDate ?? "9999-99-99";
        case "status":
          return statusPos.get(t.status) ?? 99;
        case "priority":
          return PRIO_ORDER[t.priority] ?? 9;
      }
    };
    const sorted = [...tasks].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [tasks, sort, dir, statusPos]);

  const th = (key: SortKey, label: string, extra = "") => (
    <th
      className={`cursor-pointer px-3 py-2 text-left font-medium select-none ${extra}`}
      onClick={() => {
        if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
          setSort(key);
          setDir("asc");
        }
      }}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sort === key &&
          (dir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          ))}
      </span>
    </th>
  );

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="border-line bg-surface overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-line text-ink-muted border-b text-[11px] uppercase">
            <tr>
              {th("title", "Título")}
              {th("clientName", "Cliente")}
              {th("assignee", "Responsável")}
              {th("dueDate", "Prazo")}
              {th("status", "Coluna")}
              {th("priority", "Prioridade")}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-ink-muted px-3 py-8 text-center text-xs"
                >
                  Nenhuma tarefa.
                </td>
              </tr>
            )}
            {rows.map((t) => {
              const prio = PRIORITY_META[t.priority] ?? PRIORITY_META.medium;
              const col = statuses.find((s) => s.name === t.status);
              return (
                <tr
                  key={t.id}
                  onClick={() => onOpenTask(t)}
                  className="border-line hover:bg-surface-2/50 cursor-pointer border-b last:border-0"
                >
                  <td className="px-3 py-2 font-medium">{t.title}</td>
                  <td className="text-ink-muted px-3 py-2">
                    {t.clientName ?? "—"}
                  </td>
                  <td className="text-ink-muted px-3 py-2">
                    {t.assigneeNames.join(", ") || "—"}
                  </td>
                  <td className="text-ink-muted px-3 py-2">
                    {t.dueDate ? formatDate(t.dueDate) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor: colDot(col?.color ?? "slate"),
                        }}
                      />
                      {colLabel(t.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill color={prio.color as PillColor}>
                      {prio.label}
                    </StatusPill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
