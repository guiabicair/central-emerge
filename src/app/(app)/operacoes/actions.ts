"use server";

import { revalidatePath } from "next/cache";

import { can } from "@/lib/auth/roles";
import { createUntypedClient } from "@/lib/supabase/server";

export const ROADMAP_STATUS = ["backlog", "in_progress", "blocked", "done"] as const;
export type RoadmapStatus = (typeof ROADMAP_STATUS)[number];

async function guard() {
  if (!(await can("ops.manage"))) {
    throw new Error("Sem permissão para gerir operações/agentes.");
  }
}

export async function updateRoadmapItemStatus(id: string, status: RoadmapStatus) {
  await guard();
  if (!ROADMAP_STATUS.includes(status)) throw new Error("Status inválido.");

  const supabase = await createUntypedClient();
  const { error } = await supabase
    .from("ops_roadmap_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/operacoes");
}
