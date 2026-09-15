"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";

import { resolveAlert } from "@/lib/alerts/actions";
import { cn, formatDate } from "@/lib/utils";

export interface BannerAlert {
  id: string;
  title: string;
  message: string | null;
  source_agent_name: string | null;
  created_at: string;
}

export function AlertsBannerClient({ alerts }: { alerts: BannerAlert[] }) {
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (alerts.length === 0) return null;

  function resolve(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const res = await resolveAlert(id);
      if (res.error) toast.error(res.error);
      setPendingId(null);
    });
  }

  return (
    <div className="border-b border-red-500/30 bg-red-500/10 text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2 text-left font-medium text-red-400"
      >
        <AlertTriangle className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">
          {alerts.length === 1
            ? "1 agente/rotina com problema"
            : `${alerts.length} agentes/rotinas com problema`}
        </span>
        {open ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
      </button>
      {open && (
        <div className="max-h-64 space-y-2 overflow-y-auto border-t border-red-500/20 p-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex items-start justify-between gap-3 rounded-lg bg-red-500/10 p-2.5",
                pendingId === a.id && "opacity-50",
              )}
            >
              <div className="min-w-0">
                <div className="text-foreground text-xs font-semibold">{a.title}</div>
                {a.message && (
                  <div className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{a.message}</div>
                )}
                <div className="text-muted-foreground mt-1 text-[11px]">
                  {a.source_agent_name ? `${a.source_agent_name} · ` : ""}
                  {formatDate(a.created_at)}
                </div>
              </div>
              <button
                type="button"
                title="Marcar como resolvido"
                disabled={pendingId === a.id}
                onClick={() => resolve(a.id)}
                className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
