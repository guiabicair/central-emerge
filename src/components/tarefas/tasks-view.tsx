"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { KanbanSquare, Workflow } from "lucide-react";
import { toast } from "sonner";

import { TaskDetailSheet } from "@/components/tarefas/task-detail-sheet";
import { TaskFiltersBar } from "@/components/tarefas/task-filters-bar";
import { TaskKanban } from "@/components/tarefas/task-kanban";
import { TeamLoadPanel } from "@/components/tarefas/team-load-panel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CURRENT_USER_ID, TASKS } from "@/lib/mock-data";
import {
  EMPTY_FILTERS,
  TASK_COLUMNS,
  assertAcyclic,
  countFilters,
  filterTasks,
  hasCycleWith,
  isAtrasada,
  nextColumn,
  type TaskFilters,
} from "@/lib/tasks";
import type { DependencyResponsavel, Task, TaskColumn } from "@/lib/types";

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
  const [tasks, setTasks] = useState<Task[]>(() => structuredClone(TASKS));
  const [columns, setColumns] = useState<TaskColumn[]>(() =>
    structuredClone(TASK_COLUMNS),
  );
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>("kanban");

  useEffect(() => {
    assertAcyclic(TASKS);
  }, []);

  const visibleTasks = useMemo(
    () => filterTasks(tasks, filters, CURRENT_USER_ID),
    [tasks, filters],
  );
  const atrasadasCount = useMemo(
    () => tasks.filter(isAtrasada).length,
    [tasks],
  );
  const activeFilters = countFilters(filters);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  /* ---- mutadores (estado local, reseta no reload) ---- */
  const patchTask = (id: string, patch: Partial<Task>) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );

  const handleEntregar = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const prox = nextColumn(columns, t.status);
        return prox ? { ...t, status: prox.id } : t;
      }),
    );
  };

  const handleToggleSubtask = (id: string, subId: string) =>
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              subtarefas: t.subtarefas.map((s) =>
                s.id === subId ? { ...s, concluida: !s.concluida } : s,
              ),
            }
          : t,
      ),
    );

  const handleAddSubtask = (id: string, label: string) =>
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              subtarefas: [
                ...t.subtarefas,
                { id: `st-${id}-${Date.now()}`, label, concluida: false },
              ],
            }
          : t,
      ),
    );

  const handleAddComment = (id: string, texto: string) =>
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              comentarios: [
                ...t.comentarios,
                {
                  autorId: CURRENT_USER_ID,
                  texto,
                  data: new Date().toISOString(),
                },
              ],
            }
          : t,
      ),
    );

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  };

  const handleAddDependency = useCallback(
    (
      blockerId: string,
      blockedId: string,
      motivo: string,
      responsavel: DependencyResponsavel,
    ) => {
      setTasks((prev) => {
        const blocked = prev.find((t) => t.id === blockedId);
        if (!blocked || blocked.dependsOn.some((d) => d.taskId === blockerId)) {
          return prev;
        }
        if (hasCycleWith(prev, blockerId, blockedId)) {
          toast.error("Isso criaria um ciclo de dependência", {
            description: "A conexão foi rejeitada.",
          });
          return prev;
        }
        const blocker = prev.find((t) => t.id === blockerId);
        toast.success("Dependência criada", {
          description: `"${blocker?.titulo ?? blockerId}" agora bloqueia "${blocked.titulo}".`,
        });
        return prev.map((t) =>
          t.id === blockedId
            ? {
                ...t,
                dependsOn: [
                  ...t.dependsOn,
                  { taskId: blockerId, motivo, responsavel },
                ],
              }
            : t,
        );
      });
    },
    [],
  );

  const handleRemoveDependency = useCallback(
    (blockerId: string, blockedId: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === blockedId
            ? {
                ...t,
                dependsOn: t.dependsOn.filter((d) => d.taskId !== blockerId),
              }
            : t,
        ),
      );
    },
    [],
  );

  const handleAddColumn = () => {
    setColumns((prev) => {
      const n = prev.filter((c) => c.custom).length + 1;
      return [
        ...prev,
        {
          id: `custom-${Date.now()}`,
          label: `Nova Coluna ${n}`,
          accent: "#8b918f",
          custom: true,
        },
      ];
    });
  };

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
            onAddColumn={handleAddColumn}
          />
        ) : (
          <TaskGraph
            tasks={visibleTasks}
            onOpenTask={setSelectedId}
            onAddDependency={handleAddDependency}
            onRemoveDependency={handleRemoveDependency}
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
        onRename={(id, titulo) => patchTask(id, { titulo })}
        onEntregar={handleEntregar}
        onToggleSubtask={handleToggleSubtask}
        onAddSubtask={handleAddSubtask}
        onAddComment={handleAddComment}
        onReassign={(id, pessoaId) => patchTask(id, { responsavelId: pessoaId })}
        onDelete={handleDelete}
      />
    </div>
  );
}
