"use client";

import { useMemo } from "react";
import dagre from "@dagrejs/dagre";
import { Bot, Building2, Plus, User } from "lucide-react";
import { toast } from "sonner";

import { assignTaskToUser } from "@/app/(app)/tarefas/actions";
import { EntityCanvas, type DerivedEdge } from "@/components/canvas/entity-canvas";
import { Button } from "@/components/ui/button";
import type { TaskRow } from "@/components/tarefas/tasks-board";
import {
  colDot,
  colLabel,
  type StatusCol,
} from "@/app/(app)/tarefas/task-constants";
import type { CanvasSnapshot } from "@/lib/canvas/types";
import { formatDate } from "@/lib/utils";

const PERSON_PREFIX = "person:";
const AGENT_PREFIX = "agent:";
const CLIENT_PREFIX = "client:";
const NONE_PERSON = `${PERSON_PREFIX}none`;
const NONE_CLIENT = `${CLIENT_PREFIX}none`;

const SIZE = {
  task: { w: 224, h: 108 },
  person: { w: 180, h: 44 },
  client: { w: 180, h: 48 },
} as const;

/** Layout em árvore: responsável → cliente → tarefa (dagre calcula os rankos pela topologia). */
function dagreLayout(
  items: { id: string; kind: keyof typeof SIZE }[],
  edges: { source: string; target: string }[],
) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 24, ranksep: 90, marginx: 24, marginy: 24 });
  g.setDefaultEdgeLabel(() => ({}));

  const ids = new Set(items.map((i) => i.id));
  for (const it of items) {
    const s = SIZE[it.kind];
    g.setNode(it.id, { width: s.w, height: s.h });
  }
  for (const e of edges) {
    if (ids.has(e.source) && ids.has(e.target)) g.setEdge(e.source, e.target);
  }
  dagre.layout(g);

  const pos: Record<string, { x: number; y: number }> = {};
  for (const it of items) {
    const n = g.node(it.id);
    const s = SIZE[it.kind];
    pos[it.id] = { x: (n?.x ?? 0) - s.w / 2, y: (n?.y ?? 0) - s.h / 2 };
  }
  return pos;
}

export function TaskCanvas({
  tasks,
  statuses,
  people,
  snapshot,
  canManage,
  onOpenTask,
  onCreateTask,
}: {
  tasks: TaskRow[];
  statuses: StatusCol[];
  people: { id: string; name: string }[];
  snapshot: CanvasSnapshot;
  canManage: boolean;
  onOpenTask: (id: string) => void;
  onCreateTask: () => void;
}) {
  const cols = useMemo(
    () => new Map(statuses.map((c) => [c.name, c])),
    [statuses],
  );

  const { nodes, fallbackLayout, derivedEdges } = useMemo(() => {
    const derivedEdges: DerivedEdge[] = [];
    const usedPersonIds = new Set<string>();
    const usedAgentNames = new Set<string>();
    const clientOf = new Map<string, string>(); // client node id -> label
    let needsNonePerson = false;
    let needsNoneClient = false;

    const taskNodes = tasks.map((task) => {
      const statusCol = cols.get(task.status);

      const responsibleRefs = task.assignees.map((uid) => {
        usedPersonIds.add(uid);
        return `${PERSON_PREFIX}${uid}`;
      });
      if (task.agentName) {
        usedAgentNames.add(task.agentName);
        responsibleRefs.push(`${AGENT_PREFIX}${task.agentName}`);
      }
      if (responsibleRefs.length === 0) {
        needsNonePerson = true;
        responsibleRefs.push(NONE_PERSON);
      }

      const clientRef = task.clientId ? `${CLIENT_PREFIX}${task.clientId}` : NONE_CLIENT;
      if (task.clientId) clientOf.set(clientRef, task.clientName ?? "Cliente");
      else needsNoneClient = true;

      for (const ref of responsibleRefs) {
        derivedEdges.push({ id: `rc:${ref}:${clientRef}`, source: ref, target: clientRef });
      }
      derivedEdges.push({ id: `ct:${clientRef}:${task.id}`, source: clientRef, target: task.id });

      return {
        id: task.id,
        body: (
          <div className="w-[224px] rounded-xl border border-white/10 bg-[#141719] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: statusCol ? colDot(statusCol.color) : "var(--ink-muted)",
                }}
              />
              <span className="truncate text-[13px] font-semibold text-[#eef1f0]">
                {task.title}
              </span>
            </div>
            <div className="mt-1 truncate text-[11px] text-[#8b918f]">
              {statusCol ? colLabel(statusCol.name) : task.status}
              {task.clientName ? ` · ${task.clientName}` : ""}
            </div>
            <div className="mt-2 flex items-center justify-between gap-1.5 text-[11px]">
              {task.agentName ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#45f0d1]/12 px-1.5 py-0.5 text-[#45f0d1]">
                  <Bot className="size-3" />
                  {task.agentName}
                </span>
              ) : (
                <span className="text-[#8b918f]">
                  {task.assigneeNames[0] ?? "sem responsável"}
                </span>
              )}
              {task.dueDate && (
                <span className="text-[#8b918f]">{formatDate(task.dueDate)}</span>
              )}
            </div>
          </div>
        ),
      };
    });

    const personNodes = people.map((p) => {
      const id = `${PERSON_PREFIX}${p.id}`;
      const active = usedPersonIds.has(p.id);
      return {
        id,
        body: (
          <div
            className={
              "flex w-[180px] items-center gap-2 rounded-full border px-3 py-2 " +
              (active ? "border-[#45f0d1]/40 bg-[#45f0d1]/10" : "border-white/10 bg-[#141719]")
            }
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10">
              <User className="size-3.5 text-[#eef1f0]" />
            </span>
            <span className="truncate text-[12px] font-medium text-[#eef1f0]">{p.name}</span>
          </div>
        ),
      };
    });
    if (needsNonePerson) {
      personNodes.push({
        id: NONE_PERSON,
        body: (
          <div className="flex w-[180px] items-center gap-2 rounded-full border border-dashed border-white/15 bg-[#141719]/60 px-3 py-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10">
              <User className="size-3.5 text-[#8b918f]" />
            </span>
            <span className="truncate text-[12px] text-[#8b918f]">Sem responsável</span>
          </div>
        ),
      });
    }

    const agentNodes = [...usedAgentNames].map((name) => ({
      id: `${AGENT_PREFIX}${name}`,
      body: (
        <div className="flex w-[180px] items-center gap-2 rounded-full border border-[#45f0d1]/40 bg-[#45f0d1]/10 px-3 py-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10">
            <Bot className="size-3.5 text-[#45f0d1]" />
          </span>
          <span className="truncate text-[12px] font-medium text-[#eef1f0]">{name}</span>
        </div>
      ),
    }));

    const clientNodes = [...clientOf.entries()].map(([id, label]) => ({
      id,
      body: (
        <div className="flex w-[180px] items-center gap-2 rounded-lg border border-white/10 bg-[#141719] px-3 py-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/10">
            <Building2 className="size-3.5 text-[#eef1f0]" />
          </span>
          <span className="truncate text-[12px] font-medium text-[#eef1f0]">{label}</span>
        </div>
      ),
    }));
    if (needsNoneClient) {
      clientNodes.push({
        id: NONE_CLIENT,
        body: (
          <div className="flex w-[180px] items-center gap-2 rounded-lg border border-dashed border-white/15 bg-[#141719]/60 px-3 py-2.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/10">
              <Building2 className="size-3.5 text-[#8b918f]" />
            </span>
            <span className="truncate text-[12px] text-[#8b918f]">Sem cliente</span>
          </div>
        ),
      });
    }

    const allNodes = [...personNodes, ...agentNodes, ...clientNodes, ...taskNodes];
    const layoutItems: { id: string; kind: keyof typeof SIZE }[] = [
      ...personNodes.map((n) => ({ id: n.id, kind: "person" as const })),
      ...agentNodes.map((n) => ({ id: n.id, kind: "person" as const })),
      ...clientNodes.map((n) => ({ id: n.id, kind: "client" as const })),
      ...taskNodes.map((n) => ({ id: n.id, kind: "task" as const })),
    ];
    const fallbackLayout = dagreLayout(layoutItems, derivedEdges);

    return { nodes: allNodes, fallbackLayout, derivedEdges };
  }, [tasks, cols, people]);

  const handleConnect = async (source: string, target: string) => {
    // só task ↔ pessoa vira atribuição de verdade; o resto continua anotação livre.
    const [taskId, personRef] = target.startsWith(PERSON_PREFIX)
      ? [source, target]
      : source.startsWith(PERSON_PREFIX)
        ? [target, source]
        : [null, null];
    const isPseudo = (id: string) =>
      id.startsWith(PERSON_PREFIX) || id.startsWith(AGENT_PREFIX) || id.startsWith(CLIENT_PREFIX);
    if (!taskId || !personRef || isPseudo(taskId) || personRef === NONE_PERSON) return true;
    const userId = personRef.slice(PERSON_PREFIX.length);
    try {
      await assignTaskToUser(taskId, userId);
      toast.success("Tarefa atribuída.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível atribuir.");
    }
    return false; // não cria aresta manual — a real aparece via derivedEdges no refresh
  };

  const isEntity = (id: string) =>
    !id.startsWith(PERSON_PREFIX) && !id.startsWith(AGENT_PREFIX) && !id.startsWith(CLIENT_PREFIX);

  return (
    <div className="relative h-full w-full">
      <EntityCanvas
        board="tarefas"
        canManage={canManage}
        nodes={nodes}
        fallbackLayout={fallbackLayout}
        snapshot={snapshot}
        derivedEdges={derivedEdges}
        onOpenEntity={(id) => isEntity(id) && onOpenTask(id)}
        onBeforeConnect={handleConnect}
      />
      {canManage && (
        <div className="absolute top-3 right-3 z-10">
          <Button size="sm" onClick={onCreateTask}>
            <Plus className="size-4" />
            Nova tarefa
          </Button>
        </div>
      )}
    </div>
  );
}
