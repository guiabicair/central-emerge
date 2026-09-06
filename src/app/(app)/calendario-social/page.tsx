import { Topbar } from "@/components/layout/topbar";
import { SocialBoard } from "@/components/social/social-board";
import { can } from "@/lib/auth/roles";
import {
  getSocialProjectData,
  listSocialProjects,
} from "@/lib/social/queries";
import { createUntypedClient } from "@/lib/supabase/server";

export const metadata = { title: "Calendário Social · Central Emerge" };

/**
 * Calendário Social — paridade Lovable + Kanban por status (Central).
 * Projetos > calendário mensal / kanban > posts com arte, aprovação e
 * comentários. Link público por token opaco (rota /social/[token]).
 */
export default async function CalendarioSocialPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; m?: string }>;
}) {
  const sp = await searchParams;
  const [canView, canManage] = await Promise.all([
    can("social.view"),
    can("social.manage"),
  ]);

  if (!canView) {
    return (
      <>
        <Topbar title="Calendário Social" />
        <div className="flex-1 p-6">
          <div className="border-line bg-surface rounded-2xl border p-6 text-sm">
            Você não tem acesso ao calendário social.
          </div>
        </div>
      </>
    );
  }

  const projects = await listSocialProjects();
  const active =
    projects.find((p) => p.id === sp.p)?.id ?? projects[0]?.id ?? null;
  const data = active
    ? await getSocialProjectData(active)
    : { posts: [], markers: [] };

  // tasks pro seletor "linkar tarefa" (id + título, curta)
  const db = await createUntypedClient();
  const { data: taskRows } = await db
    .from("tasks")
    .select("id, title")
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(200);
  const tasks = (taskRows ?? []) as { id: string; title: string }[];

  return (
    <>
      <Topbar
        title="Calendário Social"
        description="Posts por projeto — calendário, aprovação e link do cliente"
      />
      <SocialBoard
        projects={projects}
        activeId={active}
        posts={data.posts}
        markers={data.markers}
        tasks={tasks}
        canManage={canManage}
        month={sp.m ?? null}
      />
    </>
  );
}
