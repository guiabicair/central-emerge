"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import dagre from "@dagrejs/dagre";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import { Building2, Crown, Users } from "lucide-react";
import { toast } from "sonner";

import type { EffectiveRole, OrgData } from "@/lib/equipe/org-queries";
import { saveOrgNodePosition } from "@/app/(app)/equipe/organizacao/actions";

import "@xyflow/react/dist/style.css";

/* ================================================================== *
 * Modelo do grafo
 * ================================================================== */

const GREY = "#8b918f";

type Chip = { name: string; color: string | null };

interface CoData {
  kind: "holding" | "company";
  name: string;
  color: string | null;
  logo_url: string | null;
  frente: string | null;
  counts: { teams: number; people: number; clients: number };
  roles: Chip[];
  childCount: number;
  [k: string]: unknown;
}
interface TeamData {
  kind: "team";
  name: string;
  color: string | null;
  lead: string | null;
  members: number;
  roles: Chip[];
  [k: string]: unknown;
}
interface PersonData {
  kind: "person";
  name: string;
  email: string | null;
  avatar: string | null;
  isLead: boolean;
  effective: EffectiveRole[];
  memberships: string[];
  [k: string]: unknown;
}
interface ClientData {
  kind: "client";
  name: string;
  companies: string[];
  [k: string]: unknown;
}

const SIZE: Record<string, { w: number; h: number }> = {
  holding: { w: 210, h: 74 },
  company: { w: 236, h: 118 },
  team: { w: 208, h: 96 },
  person: { w: 248, h: 128 },
  client: { w: 188, h: 66 },
};

function originLabel(source: string) {
  if (source === "direto") return "direto";
  if (source.startsWith("time:")) return `time ${source.slice(5)}`;
  if (source.startsWith("empresa:")) return source.slice(8);
  return source;
}

/* ================================================================== *
 * Renderizadores de nó
 * ================================================================== */

function Frame({
  color,
  children,
}: {
  color?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border bg-[#141719] text-[#eef1f0] shadow-[0_1px_0_rgba(255,255,255,0.04)]"
      style={{ borderColor: `${color ?? GREY}55` }}
    >
      <Handle type="target" position={Position.Top} className="!bg-white/30" />
      {children}
      <Handle type="source" position={Position.Bottom} className="!bg-white/30" />
    </div>
  );
}

function RoleChips({ roles }: { roles: Chip[] }) {
  if (!roles.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {roles.slice(0, 6).map((r, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-1.5 py-0.5 text-[9px]"
        >
          <span
            className="size-1.5 rounded-full"
            style={{ background: r.color ?? GREY }}
          />
          {r.name}
        </span>
      ))}
    </div>
  );
}

function HoldingNode({ data }: NodeProps) {
  const d = data as CoData;
  return (
    <Frame color={d.color}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ width: SIZE.holding.w }}>
        {d.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.logo_url} alt="" className="size-8 shrink-0 rounded-md border border-white/10 object-cover" />
        ) : (
          <span
            className="grid size-8 shrink-0 place-items-center rounded-md text-[10px] font-bold text-[#0a0b0c]"
            style={{ background: d.color ?? GREY }}
          >
            {d.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold">{d.name}</div>
          <div className="text-[10px] text-[#8b918f]">
            holding · {d.childCount} {d.childCount === 1 ? "empresa" : "empresas"}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function CompanyNode({ data }: NodeProps) {
  const d = data as CoData;
  return (
    <Frame color={d.color}>
      <div className="px-3 py-2.5" style={{ width: SIZE.company.w }}>
        <div className="flex items-center gap-2">
          {d.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.logo_url} alt="" className="size-7 shrink-0 rounded-md border border-white/10 object-cover" />
          ) : (
            <span
              className="grid size-7 shrink-0 place-items-center rounded-md text-[10px] font-bold text-[#0a0b0c]"
              style={{ background: d.color ?? GREY }}
            >
              {d.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
            {d.name}
          </span>
          <Building2 className="size-3.5 shrink-0 text-[#8b918f]" />
        </div>
        <div className="mt-1 flex gap-x-3 text-[10px] text-[#8b918f]">
          <span>{d.counts.teams} times</span>
          <span>{d.counts.people} pessoas</span>
          <span>{d.counts.clients} clientes</span>
        </div>
        <RoleChips roles={d.roles} />
      </div>
    </Frame>
  );
}

function TeamNode({ data }: NodeProps) {
  const d = data as TeamData;
  return (
    <Frame color={d.color}>
      <div className="px-3 py-2.5" style={{ width: SIZE.team.w }}>
        <div className="flex items-center gap-2">
          <Users className="size-3.5 shrink-0" style={{ color: d.color ?? GREY }} />
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
            {d.name}
          </span>
          <span className="text-[10px] text-[#8b918f]">
            {d.members} {d.members === 1 ? "membro" : "membros"}
          </span>
        </div>
        {d.lead && (
          <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#fbbf24]">
            <Crown className="size-3" /> {d.lead}
          </div>
        )}
        <RoleChips roles={d.roles} />
      </div>
    </Frame>
  );
}

function PersonNode({ data }: NodeProps) {
  const d = data as PersonData;
  return (
    <Frame color="#45f0d1">
      <div className="px-3 py-2.5" style={{ width: SIZE.person.w }}>
        <div className="flex items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-[9px] font-semibold">
            {d.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.avatar} alt="" className="size-full object-cover" />
            ) : (
              d.name.slice(0, 2).toUpperCase()
            )}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
            {d.name}
          </span>
          {d.isLead && <Crown className="size-3 shrink-0 text-[#fbbf24]" />}
        </div>
        {d.email && (
          <div className="mt-0.5 truncate text-[10px] text-[#8b918f]">{d.email}</div>
        )}
        {d.effective.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {d.effective.slice(0, 5).map((e, i) => (
              <span
                key={`${e.role_id}-${e.source}-${i}`}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-1.5 py-0.5 text-[9px]"
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: e.role_color ?? GREY }}
                />
                {e.role_name}
                <span className="text-[#8b918f]">· {originLabel(e.source)}</span>
              </span>
            ))}
          </div>
        )}
        {d.memberships.length > 0 && (
          <div className="mt-1 truncate text-[9px] text-[#6b7280]">
            {d.memberships.join(" · ")}
          </div>
        )}
      </div>
    </Frame>
  );
}

function ClientNode({ data }: NodeProps) {
  const d = data as ClientData;
  return (
    <Frame color="#93a6ff">
      <div className="px-3 py-2.5" style={{ width: SIZE.client.w }}>
        <div className="truncate text-[13px] font-semibold">{d.name}</div>
        <div className="truncate text-[9px] text-[#8b918f]">
          {d.companies.length ? d.companies.join(" · ") : "sem empresa"}
        </div>
      </div>
    </Frame>
  );
}

const nodeTypes = {
  holding: HoldingNode,
  company: CompanyNode,
  team: TeamNode,
  person: PersonNode,
  client: ClientNode,
};

/* ================================================================== *
 * Layout dagre (top-down)
 * ================================================================== */

function dagreLayout(
  items: { id: string; kind: keyof typeof SIZE }[],
  edges: { source: string; target: string }[],
) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 34, ranksep: 78, marginx: 24, marginy: 24 });
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

/* ================================================================== *
 * Componente
 * ================================================================== */

export function OrgCanvas({
  data,
  positions,
}: {
  data: OrgData;
  positions: Record<string, { x: number; y: number }>;
}) {
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const [rfEdges, setRfEdges] = useEdgesState<Edge>([]);
  const draggedPos = useRef<Record<string, { x: number; y: number }>>({});
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const model = useMemo(() => {
    const companyById = new Map(data.companies.map((c) => [c.id, c]));
    const roleById = new Map(data.roles.map((r) => [r.id, r]));
    const personById = new Map(data.people.map((p) => [p.user_id, p]));
    const clientById = new Map(data.clients.map((c) => [c.id, c]));

    const childCount = new Map<string, number>();
    for (const c of data.companies) {
      if (c.parent_id && companyById.has(c.parent_id)) {
        childCount.set(c.parent_id, (childCount.get(c.parent_id) ?? 0) + 1);
      }
    }

    const teamsByCompany = new Map<string, typeof data.teams>();
    for (const t of data.teams) {
      const a = teamsByCompany.get(t.company_id) ?? [];
      a.push(t);
      teamsByCompany.set(t.company_id, a);
    }
    const membersByTeam = new Map<string, { user_id: string; is_lead: boolean }[]>();
    for (const tm of data.teamMembers) {
      const a = membersByTeam.get(tm.team_id) ?? [];
      a.push({ user_id: tm.user_id, is_lead: tm.is_lead });
      membersByTeam.set(tm.team_id, a);
    }
    const directByCompany = new Map<string, string[]>();
    for (const cm of data.companyMembers) {
      const a = directByCompany.get(cm.company_id) ?? [];
      a.push(cm.user_id);
      directByCompany.set(cm.company_id, a);
    }
    const rolesByTeam = new Map<string, Chip[]>();
    for (const tr of data.teamRoles) {
      const r = roleById.get(tr.role_id);
      if (!r) continue;
      const a = rolesByTeam.get(tr.team_id) ?? [];
      a.push({ name: r.name, color: r.color });
      rolesByTeam.set(tr.team_id, a);
    }
    const rolesByCompany = new Map<string, Chip[]>();
    for (const cr of data.companyRoles) {
      const r = roleById.get(cr.role_id);
      if (!r) continue;
      const a = rolesByCompany.get(cr.company_id) ?? [];
      a.push({ name: r.name, color: r.color });
      rolesByCompany.set(cr.company_id, a);
    }
    const clientsByCompany = new Map<string, string[]>();
    for (const cc of data.companyClients) {
      const a = clientsByCompany.get(cc.company_id) ?? [];
      a.push(cc.client_id);
      clientsByCompany.set(cc.company_id, a);
    }

    // efetivos por usuário (dedupe role_id + source)
    const effByUser = new Map<string, EffectiveRole[]>();
    const seenEff = new Set<string>();
    for (const e of data.effectiveRoles) {
      const k = `${e.user_id}|${e.role_id}|${e.source}`;
      if (seenEff.has(k)) continue;
      seenEff.add(k);
      const a = effByUser.get(e.user_id) ?? [];
      a.push(e);
      effByUser.set(e.user_id, a);
    }

    // memberships (nomes de time/empresa) + lead flag
    const membershipsByUser = new Map<string, Set<string>>();
    const leadUsers = new Set<string>();
    for (const t of data.teams) {
      for (const m of membersByTeam.get(t.id) ?? []) {
        const s = membershipsByUser.get(m.user_id) ?? new Set<string>();
        s.add(t.name);
        membershipsByUser.set(m.user_id, s);
        if (m.is_lead) leadUsers.add(m.user_id);
      }
    }
    for (const c of data.companies) {
      for (const uid of directByCompany.get(c.id) ?? []) {
        const s = membershipsByUser.get(uid) ?? new Set<string>();
        s.add(c.name);
        membershipsByUser.set(uid, s);
      }
    }

    function companyPeople(companyId: string) {
      const set = new Set(directByCompany.get(companyId) ?? []);
      for (const t of teamsByCompany.get(companyId) ?? []) {
        for (const m of membersByTeam.get(t.id) ?? []) set.add(m.user_id);
      }
      return set.size;
    }

    const items: { id: string; kind: keyof typeof SIZE; node: Node }[] = [];
    const edges: Edge[] = [];
    const usedPersons = new Set<string>();
    const usedClients = new Set<string>();

    for (const c of data.companies) {
      const isHolding = (childCount.get(c.id) ?? 0) > 0;
      const kind = isHolding ? "holding" : "company";
      const coData: CoData = {
        kind,
        name: c.name,
        color: c.color,
        logo_url: c.logo_url,
        frente: c.frente_slug,
        counts: {
          teams: (teamsByCompany.get(c.id) ?? []).length,
          people: companyPeople(c.id),
          clients: (clientsByCompany.get(c.id) ?? []).length,
        },
        roles: rolesByCompany.get(c.id) ?? [],
        childCount: childCount.get(c.id) ?? 0,
      };
      items.push({
        id: `co:${c.id}`,
        kind,
        node: { id: `co:${c.id}`, type: kind, position: { x: 0, y: 0 }, data: coData },
      });

      if (c.parent_id && companyById.has(c.parent_id)) {
        edges.push({
          id: `e:co:${c.parent_id}->co:${c.id}`,
          source: `co:${c.parent_id}`,
          target: `co:${c.id}`,
        });
      }

      for (const uid of directByCompany.get(c.id) ?? []) {
        usedPersons.add(uid);
        edges.push({
          id: `e:co:${c.id}->usr:${uid}`,
          source: `co:${c.id}`,
          target: `usr:${uid}`,
        });
      }
      for (const clientId of clientsByCompany.get(c.id) ?? []) {
        usedClients.add(clientId);
        edges.push({
          id: `e:co:${c.id}->cli:${clientId}`,
          source: `co:${c.id}`,
          target: `cli:${clientId}`,
        });
      }
    }

    for (const t of data.teams) {
      const mem = membersByTeam.get(t.id) ?? [];
      const leadM = mem.find((m) => m.is_lead);
      const leadP = leadM ? personById.get(leadM.user_id) : undefined;
      const teamData: TeamData = {
        kind: "team",
        name: t.name,
        color: t.color,
        lead: leadP ? leadP.full_name?.trim() || leadP.email : null,
        members: mem.length,
        roles: rolesByTeam.get(t.id) ?? [],
      };
      items.push({
        id: `team:${t.id}`,
        kind: "team",
        node: { id: `team:${t.id}`, type: "team", position: { x: 0, y: 0 }, data: teamData },
      });
      if (companyById.has(t.company_id)) {
        edges.push({
          id: `e:co:${t.company_id}->team:${t.id}`,
          source: `co:${t.company_id}`,
          target: `team:${t.id}`,
        });
      }
      for (const m of mem) {
        usedPersons.add(m.user_id);
        edges.push({
          id: `e:team:${t.id}->usr:${m.user_id}`,
          source: `team:${t.id}`,
          target: `usr:${m.user_id}`,
        });
      }
    }

    for (const uid of usedPersons) {
      const p = personById.get(uid);
      const personData: PersonData = {
        kind: "person",
        name: p ? p.full_name?.trim() || p.email : `Usuário ${uid.slice(0, 8)}`,
        email: p?.full_name ? p.email : null,
        avatar: p?.avatar_url ?? null,
        isLead: leadUsers.has(uid),
        effective: effByUser.get(uid) ?? [],
        memberships: [...(membershipsByUser.get(uid) ?? [])],
      };
      items.push({
        id: `usr:${uid}`,
        kind: "person",
        node: { id: `usr:${uid}`, type: "person", position: { x: 0, y: 0 }, data: personData },
      });
    }

    // clientes -> empresas a que estão atrelados
    const compsOfClient = new Map<string, string[]>();
    for (const cc of data.companyClients) {
      const co = companyById.get(cc.company_id);
      if (!co) continue;
      const a = compsOfClient.get(cc.client_id) ?? [];
      a.push(co.name);
      compsOfClient.set(cc.client_id, a);
    }
    for (const clientId of usedClients) {
      const cl = clientById.get(clientId);
      const clientData: ClientData = {
        kind: "client",
        name: cl?.name ?? `Cliente ${clientId.slice(0, 8)}`,
        companies: compsOfClient.get(clientId) ?? [],
      };
      items.push({
        id: `cli:${clientId}`,
        kind: "client",
        node: { id: `cli:${clientId}`, type: "client", position: { x: 0, y: 0 }, data: clientData },
      });
    }

    const fallback = dagreLayout(
      items.map((i) => ({ id: i.id, kind: i.kind })),
      edges.map((e) => ({ source: e.source, target: e.target })),
    );

    return { items, edges, fallback };
  }, [data]);

  useEffect(() => {
    setRfNodes(
      model.items.map((i) => ({
        ...i.node,
        position:
          draggedPos.current[i.id] ??
          positions[i.id] ??
          model.fallback[i.id] ?? { x: 0, y: 0 },
      })),
    );
  }, [model, positions, setRfNodes]);

  useEffect(() => {
    setRfEdges(
      model.edges.map((e) => ({
        ...e,
        type: "smoothstep",
        selectable: false,
        deletable: false,
        style: {
          stroke: "color-mix(in oklab, #eef1f0 26%, transparent)",
          strokeWidth: 1.4,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#eef1f099" },
      })),
    );
  }, [model, setRfEdges]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      for (const c of changes) {
        if (c.type === "position" && c.position && c.dragging === false) {
          const { x, y } = c.position;
          draggedPos.current[c.id] = { x, y };
          const prev = timers.current.get(c.id);
          if (prev) clearTimeout(prev);
          timers.current.set(
            c.id,
            setTimeout(() => {
              timers.current.delete(c.id);
              void saveOrgNodePosition(c.id, x, y).then((r) => {
                if (r?.error) toast.error(r.error);
              });
            }, 400),
          );
        }
      }
    },
    [onNodesChange],
  );

  return (
    <div className="emerge-flow h-full w-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable={false}
        deleteKeyCode={[]}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.4, maxZoom: 1 }}
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
      </ReactFlow>
    </div>
  );
}
