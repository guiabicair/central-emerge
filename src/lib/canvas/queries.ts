import "server-only";

import { createUntypedClient } from "@/lib/supabase/server";
import { SHARED_OWNER, type CanvasSnapshot } from "@/lib/canvas/types";

/**
 * Layout compartilhado de um board (posições + arestas manuais).
 * Usado nos Server Components das páginas que têm canvas.
 */
export async function getCanvasSnapshot(board: string): Promise<CanvasSnapshot> {
  const supabase = await createUntypedClient();

  const [nodesRes, edgesRes] = await Promise.all([
    supabase
      .from("app_canvas_nodes")
      .select("entity_id, x, y, color")
      .eq("board", board)
      .eq("owner", SHARED_OWNER),
    supabase
      .from("app_canvas_edges")
      .select("id, source_entity, target_entity, label")
      .eq("board", board)
      .eq("owner", SHARED_OWNER),
  ]);

  const positions: CanvasSnapshot["positions"] = {};
  const colors: CanvasSnapshot["colors"] = {};
  for (const n of (nodesRes.data ?? []) as {
    entity_id: string;
    x: number;
    y: number;
    color: string | null;
  }[]) {
    positions[n.entity_id] = { x: Number(n.x) || 0, y: Number(n.y) || 0 };
    if (n.color) colors[n.entity_id] = n.color;
  }

  const edges = ((edgesRes.data ?? []) as {
    id: string;
    source_entity: string;
    target_entity: string;
    label: string | null;
  }[]).map((e) => ({
    id: e.id,
    source: e.source_entity,
    target: e.target_entity,
    label: e.label,
  }));

  return { positions, colors, edges };
}
