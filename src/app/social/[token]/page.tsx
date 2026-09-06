import { notFound } from "next/navigation";

import { SocialPublicView } from "@/components/social/social-public-view";
import { getSocialShare } from "@/lib/social/queries";
import { createUntypedClient } from "@/lib/supabase/server";

// token é público, conteúdo muda pouco; a interação (aprovar/comentar) roda
// client-side via RPC e dá router.refresh.
export const revalidate = 60;
export const metadata = { title: "Calendário Social" };

export default async function SocialSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // 404 idêntico: token inválido, inexistente e expirado não se distinguem
  if (!token || token.length < 12) notFound();

  const data = (await getSocialShare(token)) as {
    project: { id: string; name: string; color: string };
    markers: { id: string; date: string; label: string; color: string }[];
    posts: unknown[];
  } | null;
  if (!data || !data.project) notFound();

  // registra abertura (best-effort, não bloqueia)
  try {
    const db = await createUntypedClient();
    await db.rpc("log_social_share_open", { p_token: token, p_ip: "" });
  } catch {
    /* noop */
  }

  return <SocialPublicView token={token} data={data} />;
}
