import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import type { Database } from "@/lib/supabase/database.types";
import { sendPushToAll } from "@/lib/push/server";

export const dynamic = "force-dynamic";

/**
 * Chamado pelo pg_cron do próprio Supabase (job `ops-alerts-dispatch`, a
 * cada 5 min, via pg_net) — não pelo Cron da Vercel, pra não depender do
 * plano/limite de frequência dele. Autenticado por um segredo compartilhado
 * (gerado na migration 0031, guardado em private.app_secrets no Supabase)
 * em vez de sessão de usuário, já que quem chama é o Postgres.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_ALERTS_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_ALERTS_SECRET não configurada." },
      { status: 501 },
    );
  }
  if (req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const db = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: alerts, error: alertsErr } = await db.rpc("ops_alerts_claim_pending", {
    p_limit: 50,
  });
  if (alertsErr) return NextResponse.json({ error: alertsErr.message }, { status: 500 });
  if (!alerts || alerts.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const { data: subscriptions, error: subsErr } = await db.rpc("ops_push_subscriptions_list");
  if (subsErr) return NextResponse.json({ error: subsErr.message }, { status: 500 });

  let totalSent = 0;
  const staleEndpoints = new Set<string>();

  if (subscriptions && subscriptions.length > 0) {
    for (const alert of alerts) {
      const { sent, staleEndpoints: stale } = await sendPushToAll(subscriptions, {
        title: alert.title,
        body: alert.message ?? "",
        url: alert.task_id ? "/tarefas" : "/",
      });
      totalSent += sent;
      stale.forEach((e) => staleEndpoints.add(e));
    }
  }

  await Promise.all(
    Array.from(staleEndpoints).map((endpoint) =>
      db.rpc("ops_push_subscription_remove", { p_endpoint: endpoint }),
    ),
  );

  return NextResponse.json({
    ok: true,
    alerts: alerts.length,
    subscriptions: subscriptions?.length ?? 0,
    sent: totalSent,
    removedStale: staleEndpoints.size,
  });
}
