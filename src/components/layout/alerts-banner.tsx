import { AlertsBannerClient } from "@/components/layout/alerts-banner-client";
import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export async function AlertsBanner() {
  const user = await getUser();
  if (!user) return null;

  const db = await createClient();
  const { data } = await db
    .from("ops_alerts")
    .select("id, title, message, source_agent_name, created_at")
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(20);

  return <AlertsBannerClient alerts={data ?? []} />;
}
