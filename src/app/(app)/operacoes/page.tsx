import Link from "next/link";
import { Bot, ExternalLink } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  RoadmapBoard,
  type RoadmapItemRow,
} from "@/components/operacoes/roadmap-board";
import { can } from "@/lib/auth/roles";
import { createUntypedClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Operações · Central Emerge" };

interface ProjectRow {
  id: string;
  slug: string;
  name: string;
  repo_url: string | null;
  status: string;
}

interface ActivityRow {
  id: string;
  agent_name: string;
  event_type: string;
  summary: string;
  detail: string | null;
  link: string | null;
  created_at: string;
  ops_projects: { slug: string; name: string } | null;
}

const EVENT_LABEL: Record<string, string> = {
  started: "Começou",
  progress: "Progresso",
  completed: "Concluído",
  blocked: "Bloqueado",
  deployed: "Deploy",
};

const EVENT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  started: "outline",
  progress: "secondary",
  completed: "default",
  blocked: "destructive",
  deployed: "secondary",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} d`;
}

export default async function OperacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p: activeSlug } = await searchParams;
  const supabase = await createUntypedClient();

  const [{ data: projectsData, error: projectsError }, canManage] =
    await Promise.all([
      supabase
        .from("ops_projects")
        .select("id, slug, name, repo_url, status")
        .order("name"),
      can("ops.manage"),
    ]);

  const projects = (projectsData ?? []) as ProjectRow[];
  const selected = activeSlug
    ? projects.find((p) => p.slug === activeSlug)
    : projects[0];

  const [{ data: roadmapData, error: roadmapError }, { data: activityData }] =
    selected
      ? await Promise.all([
          supabase
            .from("ops_roadmap_items")
            .select("id, title, description, status, priority, agent_name, link, updated_at")
            .eq("project_id", selected.id)
            .order("updated_at", { ascending: false }),
          supabase
            .from("ops_agent_activity")
            .select(
              "id, agent_name, event_type, summary, detail, link, created_at, ops_projects(slug, name)",
            )
            .eq("project_id", selected.id)
            .order("created_at", { ascending: false })
            .limit(50),
        ])
      : [{ data: [], error: null }, { data: [] }];

  const roadmapItems = (roadmapData ?? []) as unknown as RoadmapItemRow[];
  const activity = (activityData ?? []) as unknown as ActivityRow[];
  const loadError = projectsError?.message ?? roadmapError?.message ?? null;

  return (
    <>
      <Topbar
        title="Operações"
        description={
          loadError
            ? "Erro ao carregar — rode a migration 0022"
            : "Roadmap e atividade dos agentes, por projeto"
        }
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="text-ink-muted p-6 text-sm">
              Nenhum projeto registrado ainda. Projetos são criados
              automaticamente na primeira vez que um agente reporta uma
              atividade (RPC <code>ops_report_activity</code>).
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              {projects.map((proj) => (
                <Link
                  key={proj.id}
                  href={`/operacoes?p=${proj.slug}`}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    selected?.id === proj.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "text-ink-muted hover:text-foreground border-transparent",
                  )}
                >
                  {proj.name}
                  {proj.status !== "active" && (
                    <span className="text-ink-muted ml-1.5 text-xs">
                      ({proj.status})
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {selected && (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">Roadmap</h2>
                    {selected.repo_url && (
                      <span className="text-ink-muted text-xs">
                        {selected.repo_url}
                      </span>
                    )}
                  </div>
                  <RoadmapBoard items={roadmapItems} canManage={canManage} />
                </div>

                <div className="flex flex-col gap-3">
                  <h2 className="text-sm font-medium">Atividade dos agentes</h2>
                  <div className="flex flex-col gap-2">
                    {activity.length === 0 ? (
                      <div className="text-ink-muted rounded-xl border border-dashed p-4 text-center text-xs">
                        Nenhuma atividade reportada ainda
                      </div>
                    ) : (
                      activity.map((a) => (
                        <Card key={a.id} className="gap-1.5 py-3">
                          <CardContent className="flex flex-col gap-1.5 px-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <Bot className="text-ink-muted size-3.5" />
                                <span className="text-sm font-medium">
                                  {a.agent_name}
                                </span>
                              </div>
                              <span className="text-ink-muted text-xs">
                                {timeAgo(a.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge variant={EVENT_VARIANT[a.event_type] ?? "outline"}>
                                {EVENT_LABEL[a.event_type] ?? a.event_type}
                              </Badge>
                            </div>
                            <p className="text-sm leading-snug">{a.summary}</p>
                            {a.detail && (
                              <p className="text-ink-muted text-xs leading-snug">
                                {a.detail}
                              </p>
                            )}
                            {a.link && (
                              <a
                                href={a.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-ink-muted hover:text-foreground inline-flex items-center gap-1 text-xs"
                              >
                                <ExternalLink className="size-3" />
                                {a.link}
                              </a>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
