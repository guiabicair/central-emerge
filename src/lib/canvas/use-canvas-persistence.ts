"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";

import { actionError } from "@/lib/utils";

import {
  createCanvasEdge,
  deleteCanvasEdge,
  saveNodePosition,
} from "@/lib/canvas/actions";

/**
 * Fiação do <EntityCanvas> com as server actions de persistência.
 * - persistMove: fire-and-forget + debounce por nó (arrastar não recarrega).
 * - addEdge / removeEdge: retornam pro componente atualizar o estado local.
 */
export function useCanvasPersistence(board: string, canManage: boolean) {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const persistMove = useCallback(
    (entityId: string, x: number, y: number) => {
      if (!canManage) return;
      const prev = timers.current.get(entityId);
      if (prev) clearTimeout(prev);
      timers.current.set(
        entityId,
        setTimeout(() => {
          saveNodePosition(board, entityId, x, y).catch((e) =>
            toast.error(
              actionError(e, "Falhou ao salvar posição"),
            ),
          );
          timers.current.delete(entityId);
        }, 350),
      );
    },
    [board, canManage],
  );

  const addEdge = useCallback(
    async (source: string, target: string, label?: string) => {
      if (!canManage) return null;
      try {
        const { id } = await createCanvasEdge(board, source, target, label);
        return id;
      } catch (e) {
        toast.error(actionError(e, "Falhou ao conectar"));
        return null;
      }
    },
    [board, canManage],
  );

  const removeEdge = useCallback(
    async (id: string) => {
      if (!canManage) return false;
      try {
        await deleteCanvasEdge(board, id);
        return true;
      } catch (e) {
        toast.error(actionError(e, "Falhou ao remover conexão"));
        return false;
      }
    },
    [board, canManage],
  );

  return { persistMove, addEdge, removeEdge };
}
