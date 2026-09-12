import { NextResponse } from "next/server";

import { getUser } from "@/lib/supabase/auth";
import { createUntypedClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, fetchGoogleEmail } from "@/lib/google-calendar/oauth";
import { syncEvents } from "@/lib/google-calendar/sync";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const fail = (msg: string) =>
    NextResponse.redirect(`${origin}/configuracoes?google_error=${encodeURIComponent(msg)}`);

  if (oauthError) return fail(`Google recusou: ${oauthError}`);
  if (!code) return fail("Callback sem code.");

  const user = await getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);
  if (state !== user.id) return fail("Sessão não bate com quem iniciou a conexão.");

  const redirectUri = `${origin}/api/google-calendar/callback`;
  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    if (!tokens.refresh_token) {
      return fail(
        "Google não devolveu refresh_token — revogue o acesso em myaccount.google.com/permissions e tente conectar de novo.",
      );
    }
    const email = await fetchGoogleEmail(tokens.access_token);

    const db = await createUntypedClient();
    const { error } = await db.from("google_calendar_connections").upsert(
      {
        user_id: user.id,
        google_email: email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) return fail(error.message);

    // sincroniza na hora — sem isso a conexão fica parada até alguém clicar
    // em "Sincronizar" manualmente, e o Guilherme não viu nada aparecer.
    const count = await syncEvents(db, user.id, tokens.access_token, "primary");
    return NextResponse.redirect(
      `${origin}/configuracoes?google_connected=1&google_synced=${count}`,
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro desconhecido");
  }
}
