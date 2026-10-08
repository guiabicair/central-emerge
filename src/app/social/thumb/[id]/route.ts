import { driveViewUrl, getDriveAccessToken, getDriveConnection } from "@/lib/google-drive/drive";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

/**
 * Miniatura de uma arte do Drive servida pela própria Central. Direto do
 * Google (drive.google.com/thumbnail) ela quebra no browser de quem está
 * logado em várias contas Google. Fica sob /social/ porque a página
 * pública do cliente também usa (sem login).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const miss = () =>
    new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  if (!/^[\w-]{10,}$/.test(id)) return miss();

  // só serve arquivo que é arte de algum post (não vira proxy de qualquer id)
  const { data } = await createUntypedAdminClient()
    .from("social_post_assets")
    .select("id")
    .eq("image_url", driveViewUrl(id))
    .limit(1);
  if (!data?.length) return miss();

  let res = await fetch(`https://lh3.googleusercontent.com/d/${id}=w800`);
  if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) {
    // fallback: thumbnailLink da Drive API com o token da Emerge
    const conn = await getDriveConnection().catch(() => null);
    if (!conn) return miss();
    const token = await getDriveAccessToken(conn);
    const meta = await fetch(
      `https://www.googleapis.com/drive/v3/files/${id}?fields=thumbnailLink&supportsAllDrives=true`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const link = meta.ok ? ((await meta.json()) as { thumbnailLink?: string }).thumbnailLink : null;
    // vídeo recém-enviado ainda sem miniatura: o client mostra o ícone
    if (!link) return miss();
    res = await fetch(link.replace(/=s\d+$/, "=s800"), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return miss();
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
