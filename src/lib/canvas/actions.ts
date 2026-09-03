"use server";

import { can } from "@/lib/auth/roles";
import { getUser } from "@/lib/supabase/auth";
import { createUntypedClient } from "@/lib/supabase/server";
import { SHARED_OWNER } from "@/lib/canvas/types";

async function guard(board: string) {
  if (!(await can(`${board}.manage`))) {
    throw new Error("Sem permissão para editar este canvas.");
  }
}

/** Salva (upsert) a posição de um nó no layout compartilhado do board. */
export async function saveNodePosition(
  board: string,
  entityId: string,
  x: number,
  y: number,
) {
  await guard(board);
  if (!board || !entityId) throw new Error("board/entidade ausente.");
  const user = await getUser();
  const supabase = await createUntypedClient();
  const { error } = await supabase.from("app_canvas_nodes").upsert(
    {
      board,
      entity_id: entityId,
      x: Math.round(x),
      y: Math.round(y),
      owner: SHARED_OWNER,
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "board,entity_id,owner" },
  );
  if (error) throw new Error(error.message);
  // sem revalidatePath: arrastar não deve recarregar a página.
}

/** Cria uma aresta manual entre duas entidades. */
export async function createCanvasEdge(
  board: string,
  source: string,
  target: string,
  label?: string,
): Promise<{ id: string }> {
  await guard(board);
  if (!source || !target || source === target) {
    throw new Error("Conexão inválida.");
  }
  const user = await getUser();
  const supabase = await createUntypedClient();
  const { data, error } = await supabase
    .from("app_canvas_edges")
    .upsert(
      {
        board,
        source_entity: source,
        target_entity: target,
        label: label?.trim() || null,
        owner: SHARED_OWNER,
        created_by: user?.id ?? null,
      },
      { onConflict: "board,source_entity,target_entity,owner" },
    )
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: (data as { id: string }).id };
}

/** Remove uma aresta manual pelo id. */
export async function deleteCanvasEdge(board: string, id: string) {
  await guard(board);
  const supabase = await createUntypedClient();
  const { error } = await supabase
    .from("app_canvas_edges")
    .delete()
    .eq("id", id)
    .eq("board", board);
  if (error) throw new Error(error.message);
}
