"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";

import { DeletableEdge } from "@/components/canvas/deletable-edge";
import { EntityNode } from "@/components/canvas/entity-node";
import { useCanvasPersistence } from "@/lib/canvas/use-canvas-persistence";
import type { CanvasSnapshot } from "@/lib/canvas/types";

import "@xyflow/react/dist/style.css";

const nodeTypes = { entity: EntityNode };
const edgeTypes = { deletable: DeletableEdge };

export interface CanvasEntityNode {
  id: string;
  body: ReactNode;
}

export interface DerivedEdge {
  id: string;
  source: string;
  target: string;
}

interface EntityCanvasProps {
  board: string;
  canManage: boolean;
  /** nós já renderizados pelo caller (corpo do card) */
  nodes: CanvasEntityNode[];
  /** posições calculadas (fallback quando não há posição salva) */
  fallbackLayout: Record<string, { x: number; y: number }>;
  /** posições salvas + arestas manuais, do servidor */
  snapshot: CanvasSnapshot;
  /** arestas derivadas de FK/regra — desenhadas, não persistidas, não deletáveis */
  derivedEdges?: DerivedEdge[];
  onOpenEntity?: (id: string) => void;
}

const NO_DERIVED: DerivedEdge[] = [];

const MANUAL_STYLE = { stroke: "var(--data)", strokeWidth: 1.6 } as const;
const DERIVED_STYLE = {
  stroke: "color-mix(in oklab, var(--ink) 22%, transparent)",
  strokeWidth: 1.4,
  strokeDasharray: "4 4",
} as const;

export function EntityCanvas({
  board,
  canManage,
  nodes: entityNodes,
  fallbackLayout,
  snapshot,
  derivedEdges = NO_DERIVED,
  onOpenEntity,
}: EntityCanvasProps) {
  const { persistMove, addEdge, removeEdge } = useCanvasPersistence(
    board,
    canManage,
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // ids das arestas manuais (as que podem ser deletadas)
  const manualIds = useRef<Set<string>>(new Set());
  // posições que o usuário já arrastou nesta sessão (não sobrescrever no rebuild)
  const draggedPos = useRef<Record<string, { x: number; y: number }>>({});
  // callback de abrir — via ref pra não recriar o effect (evita loop de render)
  const onOpenRef = useRef(onOpenEntity);
  onOpenRef.current = onOpenEntity;
  const openStable = useRef((id: string) => onOpenRef.current?.(id)).current;

  const handleDeleteEdge = useCallback(
    (id: string) => {
      setRfEdges((eds) => eds.filter((e) => e.id !== id));
      if (manualIds.current.has(id)) {
        manualIds.current.delete(id);
        void removeEdge(id);
      }
    },
    [setRfEdges, removeEdge],
  );

  const nodeIndex = useMemo(
    () => new Set(entityNodes.map((n) => n.id)),
    [entityNodes],
  );

  useEffect(() => {
    setRfNodes(
      entityNodes.map((n) => ({
        id: n.id,
        type: "entity",
        position:
          draggedPos.current[n.id] ??
          snapshot.positions[n.id] ??
          fallbackLayout[n.id] ?? { x: 0, y: 0 },
        data: { body: n.body, onOpen: openStable },
      })),
    );
  }, [entityNodes, snapshot.positions, fallbackLayout, openStable, setRfNodes]);

  useEffect(() => {
    manualIds.current = new Set(snapshot.edges.map((e) => e.id));
    const manual: Edge[] = snapshot.edges
      .filter((e) => nodeIndex.has(e.source) && nodeIndex.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "deletable",
        label: e.label ?? undefined,
        style: MANUAL_STYLE,
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--data)" },
        data: { onDelete: handleDeleteEdge },
      }));
    const derived: Edge[] = derivedEdges
      .filter((e) => nodeIndex.has(e.source) && nodeIndex.has(e.target))
      .map((e) => ({
        id: `d:${e.id}`,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        selectable: false,
        deletable: false,
        style: DERIVED_STYLE,
      }));
    setRfEdges([...derived, ...manual]);
  }, [snapshot.edges, derivedEdges, nodeIndex, setRfEdges, handleDeleteEdge]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      for (const c of changes) {
        if (c.type === "position" && c.position && c.dragging === false) {
          draggedPos.current[c.id] = { x: c.position.x, y: c.position.y };
          persistMove(c.id, c.position.x, c.position.y);
        }
      }
    },
    [onNodesChange, persistMove],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      for (const c of changes) {
        if (c.type === "remove" && manualIds.current.has(c.id)) {
          manualIds.current.delete(c.id);
          void removeEdge(c.id);
        }
      }
    },
    [onEdgesChange, removeEdge],
  );

  const handleConnect = useCallback(
    async (conn: Connection) => {
      const { source, target } = conn;
      if (!source || !target || source === target) return;
      if (
        rfEdges.some(
          (e) => e.source === source && e.target === target && !e.id.startsWith("d:"),
        )
      )
        return;
      const id = await addEdge(source, target);
      if (!id) return;
      manualIds.current.add(id);
      setRfEdges((eds) => [
        ...eds,
        {
          id,
          source,
          target,
          type: "deletable",
          style: MANUAL_STYLE,
          markerEnd: { type: MarkerType.ArrowClosed, color: "var(--data)" },
          data: { onDelete: handleDeleteEdge },
        },
      ]);
    },
    [rfEdges, addEdge, setRfEdges, handleDeleteEdge],
  );

  return (
    <div className="emerge-flow h-full w-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        deleteKeyCode={canManage ? ["Backspace", "Delete"] : []}
        nodesDraggable={canManage}
        nodesConnectable={canManage}
        elementsSelectable
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.55, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: false }}
        className="bg-[#050506]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="#ffffff14"
        />
        <Controls
          showInteractive={false}
          className="!border-white/10 !bg-[#0f1112] [&_button]:!border-white/10 [&_button]:!bg-[#0f1112] [&_button]:!fill-white/70"
        />
        <MiniMap pannable zoomable maskColor="#05050699" className="!bg-[#0f1112]" />
        {canManage && (
          <Panel
            position="top-left"
            className="!m-3 max-w-[240px] rounded-lg border border-white/10 bg-[#0f1112]/90 px-3 py-2 text-[11px] text-[#8b918f]"
          >
            Arraste os cards livremente (a posição salva). Puxe de um card a
            outro pra conectar. Clique no{" "}
            <span className="text-[#eef1f0]">×</span> no meio de uma conexão pra
            removê-la. As linhas tracejadas são automáticas.
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
