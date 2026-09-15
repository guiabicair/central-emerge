"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  getNodesBounds,
  getViewportForBounds,
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
  type ReactFlowInstance,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import { Download, Printer, Search, X } from "lucide-react";
import { toast } from "sonner";

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
  /** false pra nós decorativos (ex: cabeçalho de coluna) — não arrasta, não conecta. */
  draggable?: boolean;
  connectable?: boolean;
  /** true pros nós que representam uma entidade real (tarefa, lead) — ganham o atalho "renomear". */
  renamable?: boolean;
  /** presente (true/false) = o nó ganha o atalho de colapsar/expandir seus filhos; o valor é o estado atual. */
  collapsed?: boolean;
  /** texto plano pra busca do canvas (título, cliente, responsável…); sem isso o nó nunca é filtrado. */
  searchText?: string;
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
  /** atalho de renomear (botão de lápis) pros nós marcados como `renamable` — normalmente o mesmo handler de `onOpenEntity`. */
  onRenameEntity?: (id: string) => void;
  /** atalho de colapsar/expandir pros nós que têm `collapsed` definido (true ou false). */
  onToggleCollapse?: (id: string) => void;
  /**
   * Hook chamado antes de persistir uma conexão manual. Retorne `false` para
   * indicar que a conexão já foi tratada como uma ação de domínio (ex:
   * atribuir responsável) e não deve virar uma aresta manual genérica.
   * Retorne `true` (ou omita o prop) para manter o comportamento padrão.
   */
  onBeforeConnect?: (source: string, target: string) => boolean | Promise<boolean>;
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
  onRenameEntity,
  onToggleCollapse,
  onBeforeConnect,
}: EntityCanvasProps) {
  const { persistMove, persistColor, addEdge, removeEdge } = useCanvasPersistence(
    board,
    canManage,
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // ids das arestas manuais (as que podem ser deletadas)
  const manualIds = useRef<Set<string>>(new Set());
  // posições que o usuário já arrastou nesta sessão (não sobrescrever no rebuild)
  const draggedPos = useRef<Record<string, { x: number; y: number }>>({});
  // cores que o usuário já trocou nesta sessão (não sobrescrever no rebuild)
  const coloredOverride = useRef<Record<string, string | null>>({});
  // callback de abrir — via ref pra não recriar o effect (evita loop de render)
  const onOpenRef = useRef(onOpenEntity);
  onOpenRef.current = onOpenEntity;
  const openStable = useRef((id: string) => onOpenRef.current?.(id)).current;
  // callback de renomear — via ref pelo mesmo motivo do onOpen acima.
  const onRenameRef = useRef(onRenameEntity);
  onRenameRef.current = onRenameEntity;
  const renameStable = useRef((id: string) => onRenameRef.current?.(id)).current;
  // callback de colapsar — via ref pelo mesmo motivo do onOpen acima.
  const onCollapseRef = useRef(onToggleCollapse);
  onCollapseRef.current = onToggleCollapse;
  const collapseStable = useRef((id: string) => onCollapseRef.current?.(id)).current;

  // instância do react-flow — usada só pra fitView/exportar (nada de re-render por causa dela).
  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();

  const searchIndex = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of entityNodes) {
      if (n.searchText) m.set(n.id, n.searchText.toLowerCase());
    }
    return m;
  }, [entityNodes]);

  const matchedIds = useMemo(() => {
    if (!query) return null;
    const s = new Set<string>();
    for (const [id, text] of searchIndex) if (text.includes(query)) s.add(id);
    return s;
  }, [query, searchIndex]);

  // aplica o resultado da busca nos nós já montados, sem precisar reconstruir tudo.
  useEffect(() => {
    setRfNodes((nds) =>
      nds.map((n) => {
        const matched = matchedIds ? matchedIds.has(n.id) : undefined;
        if (n.data.matched === matched) return n;
        return { ...n, data: { ...n.data, matched } };
      }),
    );
  }, [matchedIds, setRfNodes]);

  // recentra a view nos resultados quando a busca muda (debounce leve pra não brigar com a digitação).
  useEffect(() => {
    if (!matchedIds || matchedIds.size === 0) return;
    const t = setTimeout(() => {
      rfInstance.current?.fitView({
        nodes: [...matchedIds].map((id) => ({ id })),
        padding: 0.3,
        duration: 300,
        maxZoom: 1.2,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [matchedIds]);

  const handleColorChange = useCallback(
    (entityId: string, color: string | null) => {
      coloredOverride.current[entityId] = color;
      persistColor(entityId, color);
      setRfNodes((nds) =>
        nds.map((n) =>
          n.id === entityId ? { ...n, data: { ...n.data, color } } : n,
        ),
      );
    },
    [persistColor, setRfNodes],
  );
  const onColorRef = useRef(handleColorChange);
  onColorRef.current = handleColorChange;
  const colorStable = useRef(
    (entityId: string, color: string | null) => onColorRef.current(entityId, color),
  ).current;

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
        draggable: n.draggable ?? true,
        connectable: n.connectable ?? true,
        selectable: n.draggable ?? true,
        data: {
          body: n.body,
          onOpen: openStable,
          canManage,
          color: coloredOverride.current[n.id] ?? snapshot.colors[n.id] ?? null,
          onColorChange: colorStable,
          onRename: n.renamable ? renameStable : undefined,
          collapsed: n.collapsed,
          onToggleCollapse: n.collapsed !== undefined ? collapseStable : undefined,
        },
      })),
    );
  }, [
    entityNodes,
    snapshot.positions,
    snapshot.colors,
    fallbackLayout,
    openStable,
    colorStable,
    renameStable,
    collapseStable,
    canManage,
    setRfNodes,
  ]);

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
      if (onBeforeConnect && !(await onBeforeConnect(source, target))) return;
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
    [rfEdges, addEdge, setRfEdges, handleDeleteEdge, onBeforeConnect],
  );

  /** renderiza a árvore inteira (não só o que está visível na tela) num PNG, pra exportar ou imprimir. */
  const captureImage = useCallback(async () => {
    const viewportEl = wrapperRef.current?.querySelector<HTMLElement>(
      ".react-flow__viewport",
    );
    if (!viewportEl || rfNodes.length === 0) return null;

    const bounds = getNodesBounds(rfNodes);
    const padding = 48;
    const imageWidth = Math.min(Math.max(Math.round(bounds.width + padding * 2), 480), 8000);
    const imageHeight = Math.min(Math.max(Math.round(bounds.height + padding * 2), 320), 8000);
    const viewport = getViewportForBounds(bounds, imageWidth, imageHeight, 0.1, 2, padding);

    const prev = {
      transform: viewportEl.style.transform,
      width: viewportEl.style.width,
      height: viewportEl.style.height,
    };
    viewportEl.style.width = `${imageWidth}px`;
    viewportEl.style.height = `${imageHeight}px`;
    viewportEl.style.transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;

    try {
      return await toPng(viewportEl, {
        backgroundColor: "#050506",
        width: imageWidth,
        height: imageHeight,
        pixelRatio: 2,
      });
    } finally {
      viewportEl.style.transform = prev.transform;
      viewportEl.style.width = prev.width;
      viewportEl.style.height = prev.height;
    }
  }, [rfNodes]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const dataUrl = await captureImage();
      if (!dataUrl) {
        toast.error("Nada pra exportar ainda.");
        return;
      }
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${board}-canvas.png`;
      a.click();
    } catch {
      toast.error("Não foi possível exportar a imagem.");
    } finally {
      setExporting(false);
    }
  }, [captureImage, board]);

  const handlePrint = useCallback(async () => {
    setExporting(true);
    try {
      const dataUrl = await captureImage();
      if (!dataUrl) {
        toast.error("Nada pra imprimir ainda.");
        return;
      }
      const win = window.open("", "_blank");
      if (!win) {
        toast.error("O navegador bloqueou a janela de impressão.");
        return;
      }
      win.document.write(
        `<title>${board} — canvas</title><style>html,body{margin:0}img{display:block;max-width:100%}</style><img src="${dataUrl}" onload="window.print()" />`,
      );
      win.document.close();
    } catch {
      toast.error("Não foi possível preparar a impressão.");
    } finally {
      setExporting(false);
    }
  }, [captureImage, board]);

  return (
    <div ref={wrapperRef} className="emerge-flow h-full w-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onInit={(instance) => {
          rfInstance.current = instance;
        }}
        deleteKeyCode={canManage ? ["Backspace", "Delete"] : []}
        nodesDraggable={canManage}
        nodesConnectable={canManage}
        elementsSelectable
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.1, maxZoom: 1 }}
        minZoom={0.1}
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
        <Panel
          position="top-center"
          className="!m-3 flex items-center gap-1.5"
        >
          <div className="flex h-8 w-56 items-center gap-1.5 rounded-md border border-white/10 bg-[#0f1112]/90 px-2.5">
            <Search className="size-3.5 shrink-0 text-[#8b918f]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar no canvas…"
              className="w-full bg-transparent text-[12px] text-[#eef1f0] outline-none placeholder:text-[#8b918f]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                title="Limpar busca"
                className="shrink-0 text-[#8b918f] hover:text-[#eef1f0]"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {query && (
            <span className="rounded-md border border-white/10 bg-[#0f1112]/90 px-2 py-1.5 text-[11px] text-[#8b918f]">
              {matchedIds?.size ?? 0}{" "}
              {matchedIds?.size === 1 ? "resultado" : "resultados"}
            </span>
          )}
          <button
            type="button"
            title="Exportar como PNG"
            disabled={exporting}
            onClick={handleExport}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#0f1112]/90 text-[#8b918f] transition-colors hover:text-[#eef1f0] disabled:opacity-40"
          >
            <Download className="size-3.5" />
          </button>
          <button
            type="button"
            title="Imprimir a árvore"
            disabled={exporting}
            onClick={handlePrint}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#0f1112]/90 text-[#8b918f] transition-colors hover:text-[#eef1f0] disabled:opacity-40"
          >
            <Printer className="size-3.5" />
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
