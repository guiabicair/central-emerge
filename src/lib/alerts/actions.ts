"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function resolveAlert(id: string): Promise<{ error?: string }> {
  const db = await createClient();
  const { error } = await db
    .from("ops_alerts")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}
