import { NextResponse } from "next/server";

import { getUser } from "@/lib/supabase/auth";
import { buildAuthUrl } from "@/lib/google-calendar/oauth";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const redirectUri = new URL("/api/google-calendar/callback", request.url).toString();
  try {
    const authUrl = buildAuthUrl(redirectUri, user.id);
    return NextResponse.redirect(authUrl);
  } catch (e) {
    const msg = encodeURIComponent(e instanceof Error ? e.message : "Erro desconhecido");
    return NextResponse.redirect(
      new URL(`/configuracoes?google_error=${msg}`, request.url),
    );
  }
}
