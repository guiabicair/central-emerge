"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { DayAgenda } from "@/components/calendario/day-agenda";
import { MonthGrid } from "@/components/calendario/month-grid";
import { PersonAgenda } from "@/components/calendario/person-agenda";
import { TaskDetailSheet } from "@/components/tarefas/task-detail-sheet";
import { useTaskStore } from "@/components/tarefas/use-task-store";
import { Button } from "@/components/ui/button";
import { PROJECTS, TEAM, TEAM_BY_ID } from "@/lib/mock-data";
import { addMonths, monthLabel, startOfMonth, ymd } from "@/lib/calendar";
import type { Task } from "@/lib/types";

const ALL = "todos";

export function CalendarView() {
  const store = useTaskStore();
  const { tasks, columns } = store;

  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());
  const [pessoaId, setPessoaId] = useState<string>(ALL);
  const [projetoId, setProjetoId] = useState<string>(ALL);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const visibleTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (pessoaId !== ALL && t.responsavelId !== pessoaId) return false;
        if (projetoId !== ALL && t.projetoId !== projetoId) return false;
        return true;
      }),
    [tasks, pessoaId, projetoId],
  );

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of visibleTasks) {
      const key = t.prazo.slice(0, 10);
      const arr = map.get(key);
      if (arr) arr.push(t);
      else map.set(key, [t]);
    }
    return map;
  }, [visibleTasks]);

  const selectedDayTasks = tasksByDay.get(ymd(selectedDay)) ?? [];
  const selected = tasks.find((t) => t.id === selectedTaskId) ?? null;
  const pessoaNome =
    pessoaId !== ALL ? (TEAM_BY_ID[pessoaId]?.nome ?? "") : "";

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
      {/* filtros + navegação */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-1 flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="w-40 text-center text-sm font-semibold">
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
            setSelectedDay(now);
          }}
        >
          <CalendarDays className="size-3.5" />
          Hoje
        </Button>

        <select
          value={pessoaId}
          onChange={(e) => setPessoaId(e.target.value)}
          className="border-input bg-card h-8 rounded-lg border px-2 text-xs outline-none"
        >
          <option value={ALL}>Todas as pessoas</option>
          {TEAM.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>

        <select
          value={projetoId}
          onChange={(e) => setProjetoId(e.target.value)}
          className="border-input bg-card h-8 max-w-56 rounded-lg border px-2 text-xs outline-none"
        >
          <option value={ALL}>Todos os projetos</option>
          {PROJECTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>

        {(pessoaId !== ALL || projetoId !== ALL) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => {
              setPessoaId(ALL);
              setProjetoId(ALL);
            }}
          >
            Limpar
          </Button>
        )}
      </div>

      {/* grid + agenda do dia */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <MonthGrid
          month={month}
          selectedDay={selectedDay}
          tasksByDay={tasksByDay}
          onSelectDay={setSelectedDay}
        />
        <div className="h-[440px] lg:h-auto">
          <DayAgenda
            day={selectedDay}
            tasks={selectedDayTasks}
            onOpenTask={setSelectedTaskId}
          />
        </div>
      </div>

      {/* fila cronológica da pessoa selecionada */}
      {pessoaId !== ALL && (
        <PersonAgenda
          pessoaNome={pessoaNome}
          tasks={visibleTasks}
          onOpenTask={setSelectedTaskId}
        />
      )}

      <TaskDetailSheet
        task={selected}
        columns={columns}
        allTasks={tasks}
        onOpenChange={(open) => {
          if (!open) setSelectedTaskId(null);
        }}
        onNavigateTask={setSelectedTaskId}
        onRename={(id, titulo) => store.patchTask(id, { titulo })}
        onEntregar={store.entregar}
        onToggleSubtask={store.toggleSubtask}
        onAddSubtask={store.addSubtask}
        onAddComment={store.addComment}
        onReassign={(id, pessoa) =>
          store.patchTask(id, { responsavelId: pessoa })
        }
        onDelete={(id) => {
          store.deleteTask(id);
          setSelectedTaskId(null);
        }}
      />
    </div>
  );
}
