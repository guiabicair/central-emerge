import { NextResponse } from "next/server";

import { getSessionAccess } from "@/lib/auth/roles";
import { buildDriveAuthUrl } from "@/lib/google-drive/drive";
import { getUser } from "@/lib/supabase/auth";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const fail = (msg: string) =>
    NextResponse.redirect(
      new URL(`/configuracoes?google_error=${encodeURIComponent(msg)}`, request.url),
    );
  // conexão é da empresa inteira — só admin conecta
  if (!(await getSessionAccess()).isAdmin) return fail("Só admin conecta o Google Drive.");

  const redirectUri = new URL("/api/google-drive/callback", request.url).toString();
  try {
    return NextResponse.redirect(buildDriveAuthUrl(redirectUri, user.id));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro desconhecido");
  }
}
