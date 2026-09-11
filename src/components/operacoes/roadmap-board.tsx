"use client";

import { useTransition } from "react";
import { ExternalLink, MoreVertical } from "lucide-react";
import { toast } from "sonner";

import {
  ROADMAP_STATUS,
  type RoadmapStatus,
  updateRoadmapItemStatus,
} from "@/app/(app)/operacoes/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { actionError } from "@/lib/utils";

export interface RoadmapItemRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  agent_name: string | null;
  link: string | null;
  updated_at: string;
}

const COLUMNS: { id: RoadmapStatus; label: string; dot: string }[] = [
  { id: "backlog", label: "Backlog", dot: "var(--ink-muted)" },
  { id: "in_progress", label: "Em progresso", dot: "var(--wip)" },
  { id: "blocked", label: "Bloqueado", dot: "var(--destructive)" },
  { id: "done", label: "Feito", dot: "var(--done)" },
];

const PRIORITY_LABEL: Record<string, string> = {
  p0: "P0",
  p1: "P1",
  p2: "P2",
  p3: "P3",
};

export function RoadmapBoard({
  items,
  canManage,
}: {
  items: RoadmapItemRow[];
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function move(id: string, status: RoadmapStatus) {
    startTransition(async () => {
      try {
        await updateRoadmapItemStatus(id, status);
      } catch (e) {
        toast.error(actionError(e));
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => {
        const colItems = items.filter((i) => i.status === col.id);
        return (
          <div key={col.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-1 text-sm font-medium">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: col.dot }}
              />
              {col.label}
              <span className="text-ink-muted font-normal">
                {colItems.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {colItems.length === 0 ? (
                <div className="text-ink-muted rounded-xl border border-dashed p-4 text-center text-xs">
                  Nada aqui
                </div>
              ) : (
                colItems.map((item) => (
                  <Card key={item.id} className="gap-2 py-3">
                    <CardContent className="flex flex-col gap-2 px-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">
                          {item.title}
                        </p>
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  className="size-6 shrink-0 p-0"
                                  disabled={pending}
                                >
                                  <MoreVertical className="size-3.5" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end">
                              {ROADMAP_STATUS.filter((s) => s !== item.status).map(
                                (s) => (
                                  <DropdownMenuItem
                                    key={s}
                                    onClick={() => move(item.id, s)}
                                  >
                                    Mover para{" "}
                                    {COLUMNS.find((c) => c.id === s)?.label}
                                  </DropdownMenuItem>
                                ),
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-ink-muted text-xs leading-snug">
                          {item.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.priority && (
                          <Badge variant="outline">
                            {PRIORITY_LABEL[item.priority] ?? item.priority}
                          </Badge>
                        )}
                        {item.agent_name && (
                          <Badge variant="secondary">{item.agent_name}</Badge>
                        )}
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-ink-muted hover:text-foreground inline-flex items-center gap-1 text-xs"
                          >
                            <ExternalLink className="size-3" />
                            link
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
