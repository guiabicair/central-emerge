"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CURRENT_USER_ID, TASKS } from "@/lib/mock-data";
import {
  TASK_COLUMNS,
  assertAcyclic,
  hasCycleWith,
  nextColumn,
} from "@/lib/tasks";
import type { DependencyResponsavel, Task, TaskColumn } from "@/lib/types";

/**
 * Estado local das tasks + colunas, com todos os mutadores.
 * Compartilhado entre a tela de Tarefas e o Calendário (cada tela tem a
 * sua instancia — reseta no reload, como o resto do app na fase de mock).
 */
export interface TaskStore {
  tasks: Task[];
  columns: TaskColumn[];
  patchTask: (id: string, patch: Partial<Task>) => void;
  entregar: (id: string) => void;
  toggleSubtask: (id: string, subId: string) => void;
  addSubtask: (id: string, label: string) => void;
  addComment: (id: string, texto: string) => void;
  deleteTask: (id: string) => void;
  addColumn: () => void;
  addDependency: (
    blockerId: string,
    blockedId: string,
    motivo: string,
    responsavel: DependencyResponsavel,
  ) => void;
  removeDependency: (blockerId: string, blockedId: string) => void;
}

export function useTaskStore(): TaskStore {
  const [tasks, setTasks] = useState<Task[]>(() => structuredClone(TASKS));
  const [columns, setColumns] = useState<TaskColumn[]>(() =>
    structuredClone(TASK_COLUMNS),
  );

  useEffect(() => {
    assertAcyclic(TASKS);
  }, []);

  const patchTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const entregar = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const prox = nextColumn(columns, t.status);
        return prox ? { ...t, status: prox.id } : t;
      }),
    );
    // `columns` capturado via closure; ok pois colunas raramente mudam
  }, [columns]);

  const toggleSubtask = useCallback((id: string, subId: string) => {
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
  }, []);

  const addSubtask = useCallback((id: string, label: string) => {
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
  }, []);

  const addComment = useCallback((id: string, texto: string) => {
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
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addColumn = useCallback(() => {
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
  }, []);

  const addDependency = useCallback(
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

  const removeDependency = useCallback(
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

  return {
    tasks,
    columns,
    patchTask,
    entregar,
    toggleSubtask,
    addSubtask,
    addComment,
    deleteTask,
    addColumn,
    addDependency,
    removeDependency,
  };
}
