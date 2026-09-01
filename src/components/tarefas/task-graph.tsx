"use client";

import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";

import { TaskNode, type TaskNodeData } from "@/components/tarefas/task-node";
import { CLIENTS_BY_ID, TEAM_BY_ID } from "@/lib/mock-data";
import { PILL_HEX } from "@/components/status-pill";
import {
  PRIORITY_META,
  TASK_COLUMNS,
  buildDependencyEdges,
  connectedTaskIds,
  isAtrasada,
  layoutWithDagre,
} from "@/lib/tasks";
import type { Task } from "@/lib/types";

import "@xyflow/react/dist/style.css";

const nodeTypes = { task: TaskNode };

const NODE_W = 236;
const NODE_H = 112;
const ISO_PER_ROW = 4;
const ISO_GAP_X = 260;
const ISO_GAP_Y = 132;

const EDGE_TONE_COLOR = {
  done: "rgba(255,255,255,0.18)",
  open: "#fbbf24",
  late: "#f87171",
} as const;

export function TaskGraph({
  tasks,
  onOpenTask,
}: {
  tasks: Task[];
  onOpenTask: (id: string) => void;
}) {
  const { nodes, edges } = useMemo(() => {
    const visibleIds = new Set(tasks.map((t) => t.id));
    const depEdges = buildDependencyEdges(tasks).filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target),
    );
    const connected = connectedTaskIds(tasks, depEdges);

    const connectedTasks = tasks.filter((t) => connected.has(t.id));
    const isolatedTasks = tasks.filter((t) => !connected.has(t.id));

    const layout = layoutWithDagre(
      connectedTasks.map((t) => t.id),
      depEdges,
      { width: NODE_W, height: NODE_H, rankdir: "LR" },
    );

    const maxY = Object.values(layout).reduce(
      (m, p) => Math.max(m, p.y),
      0,
    );
    const isoBaseY = connectedTasks.length > 0 ? maxY + NODE_H + 120 : 0;

    const toData = (task: Task): TaskNodeData => {
      const person = TEAM_BY_ID[task.responsavelId];
      const cliente = task.clienteId
        ? CLIENTS_BY_ID[task.clienteId]
        : undefined;
      const col =
        TASK_COLUMNS.find((c) => c.id === task.status) ?? TASK_COLUMNS[0]!;
      return {
        titulo: task.titulo,
        responsavel: person?.iniciais ?? "--",
        responsavelCor: person?.cor ?? "#8b918f",
        prioridadeLabel: PRIORITY_META[task.prioridade].label,
        prioridadeCor: PILL_HEX[PRIORITY_META[task.prioridade].color],
        colunaLabel: col.label,
        colunaCor: col.accent,
        atrasada: isAtrasada(task),
        cliente: cliente ? cliente.empresa : "Sem cliente",
        onOpen: onOpenTask,
      };
    };

    const nodes: Node[] = [];

    connectedTasks.forEach((task) => {
      nodes.push({
        id: task.id,
        type: "task",
        position: layout[task.id] ?? { x: 0, y: 0 },
        data: toData(task),
      });
    });

    isolatedTasks.forEach((task, i) => {
      nodes.push({
        id: task.id,
        type: "task",
        position: {
          x: (i % ISO_PER_ROW) * ISO_GAP_X,
          y: isoBaseY + Math.floor(i / ISO_PER_ROW) * ISO_GAP_Y,
        },
        data: toData(task),
      });
    });

    const edges: Edge[] = depEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      animated: e.tone === "late",
      style: { stroke: EDGE_TONE_COLOR[e.tone], strokeWidth: 1.6 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: EDGE_TONE_COLOR[e.tone],
      },
    }));

    return { nodes, edges };
  }, [tasks, onOpenTask]);

  return (
    <div className="emerge-flow h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.15}
        nodesConnectable={false}
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
        <MiniMap
          pannable
          zoomable
          maskColor="#05050699"
          className="!bg-[#0f1112]"
          nodeColor={(n) =>
            (n.data as TaskNodeData)?.atrasada ? "#f87171" : "#45f0d1"
          }
        />
        <Panel
          position="top-left"
          className="!m-3 rounded-lg border border-white/10 bg-[#0f1112]/90 px-3 py-2 text-[11px] text-[#8b918f]"
        >
          <div className="mb-1 font-medium text-[#eef1f0]">
            Grafo de dependências
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-px w-4" style={{ background: "#f87171" }} />
            bloqueadora atrasada
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-px w-4" style={{ background: "#fbbf24" }} />
            bloqueadora em aberto
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="h-px w-4"
              style={{ background: "rgba(255,255,255,0.3)" }}
            />
            bloqueadora concluída
          </div>
          <div className="mt-1 border-t border-white/10 pt-1">
            faixa inferior = sem dependências
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
