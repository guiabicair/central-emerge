"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeChange,
} from "@xyflow/react";

import {
  LeadNode,
  StageNode,
  type LeadNodeData,
  type StageNodeData,
} from "@/components/pipeline/flow-nodes";
import { PIPELINE_FLOW_ORDER, PIPELINE_STAGES } from "@/lib/pipeline";
import { TEAM_BY_ID } from "@/lib/mock-data";
import type { XY } from "@/lib/tasks";
import type { Lead } from "@/lib/types";

import "@xyflow/react/dist/style.css";

const nodeTypes = { stage: StageNode, lead: LeadNode };

const COL_WIDTH = 320;
const ROW_HEIGHT = 128;

function buildGraph(
  leads: Lead[],
  overrides: Record<string, XY>,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  PIPELINE_STAGES.forEach((stage, col) => {
    const stageLeads = leads.filter((l) => l.stage === stage.id);
    const stageNodeId = `stage-${stage.id}`;

    nodes.push({
      id: stageNodeId,
      type: "stage",
      position: { x: col * COL_WIDTH, y: 0 },
      data: {
        label: stage.label,
        accent: stage.accent,
        count: stageLeads.length,
        total: stageLeads.reduce((s, l) => s + l.valor, 0),
      } satisfies StageNodeData,
      draggable: false,
      selectable: false,
    });

    stageLeads.forEach((lead, row) => {
      const responsavel = TEAM_BY_ID[lead.responsavelId];
      const leadNodeId = `lead-${lead.id}`;

      nodes.push({
        id: leadNodeId,
        type: "lead",
        position:
          overrides[leadNodeId] ?? {
            x: col * COL_WIDTH,
            y: 130 + row * ROW_HEIGHT,
          },
        data: {
          nome: lead.nome,
          empresa: lead.empresa,
          segmento: lead.segmento,
          valor: lead.valor,
          accent: stage.accent,
          tag: lead.tag.label,
          responsavel: responsavel?.iniciais ?? "--",
          responsavelCor: responsavel?.cor ?? "#8b918f",
        } satisfies LeadNodeData,
      });

      edges.push({
        id: `e-${stageNodeId}-${leadNodeId}`,
        source: stageNodeId,
        target: leadNodeId,
        type: "smoothstep",
      });
    });
  });

  for (let i = 0; i < PIPELINE_FLOW_ORDER.length - 1; i++) {
    edges.push({
      id: `e-prog-${i}`,
      source: `stage-${PIPELINE_FLOW_ORDER[i]}`,
      target: `stage-${PIPELINE_FLOW_ORDER[i + 1]}`,
      type: "smoothstep",
      animated: true,
      className: "is-progression",
    });
  }

  edges.push({
    id: "e-prog-perdido",
    source: "stage-negociacao",
    target: "stage-perdido",
    type: "smoothstep",
    style: { strokeDasharray: "4 4", stroke: "#f8717188" },
  });

  return { nodes, edges };
}

export function PipelineFlow({
  leads,
  onOpenLead,
}: {
  leads: Lead[];
  onOpenLead: (id: string) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  const positionsRef = useRef<Record<string, XY>>({});
  const prevStageRef = useRef<Record<string, string>>({});

  useEffect(() => {
    for (const l of leads) {
      const prev = prevStageRef.current[l.id];
      if (prev !== undefined && prev !== l.stage) {
        delete positionsRef.current[`lead-${l.id}`];
      }
      prevStageRef.current[l.id] = l.stage;
    }
    const { nodes: n, edges: e } = buildGraph(leads, positionsRef.current);
    setNodes(n);
    setEdges(e);
  }, [leads, setNodes, setEdges]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      for (const c of changes) {
        if (c.type === "position" && c.position && c.dragging === false) {
          positionsRef.current[c.id] = { x: c.position.x, y: c.position.y };
        }
      }
    },
    [onNodesChange],
  );

  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (node.id.startsWith("lead-")) onOpenLead(node.id.slice(5));
    },
    [onOpenLead],
  );

  return (
    <div className="emerge-flow h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onNodeClick={handleNodeClick}
        nodesDraggable
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
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
          nodeColor={(n) => (n.data as { accent?: string })?.accent ?? "#45f0d1"}
        />
      </ReactFlow>
    </div>
  );
}
