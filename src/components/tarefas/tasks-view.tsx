"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { KanbanSquare, Workflow } from "lucide-react";

import { TaskDetailSheet } from "@/components/tarefas/task-detail-sheet";
import { TaskFiltersBar } from "@/components/tarefas/task-filters-bar";
import { TaskKanban } from "@/components/tarefas/task-kanban";
import { TeamLoadPanel } from "@/components/tarefas/team-load-panel";
import { useTaskStore } from "@/components/tarefas/use-task-store";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CURRENT_USER_ID } from "@/lib/mock-data";
import {
  EMPTY_FILTERS,
  countFilters,
  filterTasks,
  isAtrasada,
  type TaskFilters,
} from "@/lib/tasks";

const TaskGraph = dynamic(
  () => import("@/components/tarefas/task-graph").then((m) => m.TaskGraph),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground grid h-full place-items-center text-sm">
        Carregando grafo…
      </div>
    ),
  },
);

type ViewMode = "kanban" | "grafo";

export function TasksView() {
  const store = useTaskStore();
  const { tasks, columns } = store;

  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>("kanban");

  const visibleTasks = useMemo(
    () => filterTasks(tasks, filters, CURRENT_USER_ID),
    [tasks, filters],
  );
  const atrasadasCount = useMemo(() => tasks.filter(isAtrasada).length, [tasks]);
  const activeFilters = countFilters(filters);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TeamLoadPanel tasks={tasks} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <TaskFiltersBar
          filters={filters}
          onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
          onReset={() => setFilters(EMPTY_FILTERS)}
          hasActive={activeFilters > 0}
          atrasadasCount={atrasadasCount}
        />

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as ViewMode)}
          className="px-4 pb-1 md:px-6"
        >
          <TabsList>
            <TabsTrigger value="kanban">
              <KanbanSquare className="size-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="grafo">
              <Workflow className="size-4" />
              Nós
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="border-border min-h-0 flex-1 border-t">
        {mode === "kanban" ? (
          <TaskKanban
            tasks={visibleTasks}
            columns={columns}
            onOpenTask={setSelectedId}
            onAddColumn={store.addColumn}
          />
        ) : (
          <TaskGraph
            tasks={visibleTasks}
            onOpenTask={setSelectedId}
            onAddDependency={store.addDependency}
            onRemoveDependency={store.removeDependency}
          />
        )}
      </div>

      <TaskDetailSheet
        task={selected}
        columns={columns}
        allTasks={tasks}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        onNavigateTask={setSelectedId}
        onRename={(id, titulo) => store.patchTask(id, { titulo })}
        onEntregar={store.entregar}
        onToggleSubtask={store.toggleSubtask}
        onAddSubtask={store.addSubtask}
        onAddComment={store.addComment}
        onReassign={(id, pessoaId) =>
          store.patchTask(id, { responsavelId: pessoaId })
        }
        onDelete={(id) => {
          store.deleteTask(id);
          setSelectedId(null);
        }}
      />
    </div>
  );
}
