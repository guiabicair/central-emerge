"use client";

import { Globe, Mail, Phone } from "lucide-react";

import { LeadTagPill } from "@/components/pipeline/lead-tag";
import { PersonCell } from "@/components/person-cell";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PIPELINE_STAGES, STAGE_BY_ID } from "@/lib/pipeline";
import type { Lead, PipelineStageId } from "@/lib/types";
import { formatCurrency, relativeDate } from "@/lib/utils";

interface Props {
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
  onChangeStage: (id: string, stage: PipelineStageId) => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </div>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

export function LeadDetailSheet({ lead, onOpenChange, onChangeStage }: Props) {
  if (!lead) return <Sheet open={false} onOpenChange={onOpenChange} />;

  const stage = STAGE_BY_ID[lead.stage];

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[420px]">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-border border-b p-5 pr-12">
            <SheetTitle className="text-base font-semibold">
              {lead.nome}
            </SheetTitle>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {lead.empresa && (
                <span className="text-muted-foreground text-xs">
                  {lead.empresa}
                </span>
              )}
              <LeadTagPill tag={lead.tag} />
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <div>
              <div className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                Estágio
              </div>
              <select
                value={lead.stage}
                onChange={(e) =>
                  onChangeStage(lead.id, e.target.value as PipelineStageId)
                }
                className="border-input mt-1 h-9 w-full rounded-md border bg-transparent px-2 text-sm outline-none"
              >
                {PIPELINE_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="text-muted-foreground mt-1 text-[11px]">
                {stage?.descricao}
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                Contato
              </div>
              {lead.telefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="text-muted-foreground size-3.5" />
                  {lead.telefone}
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="text-muted-foreground size-3.5" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              {lead.site && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="text-muted-foreground size-3.5" />
                  {lead.site}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Segmento">{lead.segmento}</Field>
              <Field label="Valor">
                <span className="text-brand font-semibold">
                  {formatCurrency(lead.valor)}
                </span>
              </Field>
              <Field label="Responsável">
                <PersonCell responsavelId={lead.responsavelId} />
              </Field>
              <Field label="Atualizado">{relativeDate(lead.atualizadoEm)}</Field>
            </div>

            {lead.origem && <Field label="Origem">{lead.origem}</Field>}
            {lead.observacao && (
              <Field label="Observação">
                <span className="text-muted-foreground">{lead.observacao}</span>
              </Field>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
