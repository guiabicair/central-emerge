import { NextResponse } from "next/server";

import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sem sessão." }, { status: 401 });

  const body = (await req.json()) as { endpoint?: string };
  if (!body.endpoint) {
    return NextResponse.json({ error: "endpoint é obrigatório." }, { status: 400 });
  }

  const db = await createClient();
  const { error } = await db
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", body.endpoint);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
