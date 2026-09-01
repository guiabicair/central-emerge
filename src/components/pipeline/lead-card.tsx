import { Globe, Mail, Phone } from "lucide-react";

import { LeadTagPill } from "@/components/pipeline/lead-tag";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TEAM_BY_ID } from "@/lib/mock-data";
import type { Lead } from "@/lib/types";
import { cn, formatCompactCurrency, relativeDate } from "@/lib/utils";

export function LeadCard({ lead }: { lead: Lead }) {
  const responsavel = TEAM_BY_ID[lead.responsavelId];

  return (
    <article className="group border-border bg-card hover:border-brand/40 rounded-xl border p-3.5 shadow-sm transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold">{lead.nome}</h4>
          {lead.empresa && (
            <p className="text-muted-foreground truncate text-xs">
              {lead.empresa}
            </p>
          )}
        </div>
        <LeadTagPill tag={lead.tag} />
      </div>

      <div className="text-muted-foreground mt-3 flex flex-col gap-1.5 text-xs">
        {lead.telefone && (
          <span className="flex items-center gap-2">
            <Phone className="size-3.5 shrink-0" />
            <span className="truncate">{lead.telefone}</span>
          </span>
        )}
        {lead.email && (
          <span className="flex items-center gap-2">
            <Mail className="size-3.5 shrink-0" />
            <span className="truncate">{lead.email}</span>
          </span>
        )}
        {lead.site && (
          <span className="flex items-center gap-2">
            <Globe className="size-3.5 shrink-0" />
            <span className="truncate">{lead.site}</span>
          </span>
        )}
      </div>

      <div className="bg-border/70 my-3 h-px" />

      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground rounded-md bg-white/5 px-1.5 py-0.5 text-[11px]">
          {lead.segmento}
        </span>
        <span className="text-brand text-sm font-semibold">
          {formatCompactCurrency(lead.valor)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarFallback
              className={cn("text-[10px] font-semibold")}
              style={{
                backgroundColor: `${responsavel?.cor ?? "#8b918f"}22`,
                color: responsavel?.cor ?? "#8b918f",
              }}
            >
              {responsavel?.iniciais ?? "--"}
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground text-[11px]">
            {responsavel?.nome ?? "Sem responsável"}
          </span>
        </div>
        <span className="text-muted-foreground text-[11px]">
          {relativeDate(lead.atualizadoEm)}
        </span>
      </div>
    </article>
  );
}
