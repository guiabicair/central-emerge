import { NextResponse } from "next/server";

import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

interface SubscribeBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sem sessão." }, { status: 401 });

  const body = (await req.json()) as Partial<SubscribeBody>;
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });
  }

  const db = await createClient();
  const { error } = await db.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth_key: body.keys.auth,
      user_agent: req.headers.get("user-agent"),
    },
    { onConflict: "endpoint" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
