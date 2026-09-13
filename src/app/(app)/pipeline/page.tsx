import { Topbar } from "@/components/layout/topbar";
import { PipelineBoard, type LeadRow } from "@/components/pipeline/pipeline-board";
import type { OutreachRow } from "@/components/pipeline/outreach-panel";
import { can } from "@/lib/auth/roles";
import { getCanvasSnapshot } from "@/lib/canvas/queries";
import { createClient, createUntypedClient } from "@/lib/supabase/server";

export const metadata = { title: "Pipeline · Central Emerge" };

interface OutreachDb {
  id: string;
  lead_id: number;
  to_email: string;
  subject: string;
  body: string;
  status: OutreachRow["status"];
  error: string | null;
  created_at: string;
  sent_at: string | null;
}

export default async function PipelinePage() {
  const supabase = await createClient();
  const db = await createUntypedClient();

  const [{ data, error }, statusesRes, outreachRes, canManage, canvas] = await Promise.all([
    supabase
      .from("vendas_leads")
      .select(
        "id, empresa, unidade, frente, segmento, contato, origem, valor_estimado, responsavel, status, motivo_fit, proposta_slug, criado_por, criado_em",
      )
      .order("atualizado_em", { ascending: false }),
    db.from("lead_statuses").select("id, name, color, position").order("position"),
    db
      .from("outreach_messages")
      .select("id, lead_id, to_email, subject, body, status, error, created_at, sent_at")
      .order("created_at", { ascending: false }),
    can("pipeline.manage"),
    getCanvasSnapshot("pipeline"),
  ]);

  const leads = (data ?? []) as LeadRow[];
  const statuses = (statusesRes.data ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    color: (s.color as string) ?? "slate",
    position: (s.position as number) ?? 0,
  }));

  const empresaByLeadId = new Map(leads.map((l) => [l.id, l.empresa]));
  const unidadeByLeadId = new Map(leads.map((l) => [l.id, l.unidade]));
  const outreach: OutreachRow[] = ((outreachRes.data ?? []) as OutreachDb[]).map((o) => ({
    id: o.id,
    leadId: o.lead_id,
    unidade: unidadeByLeadId.get(o.lead_id) ?? "labs",
    empresa: empresaByLeadId.get(o.lead_id) ?? `Lead #${o.lead_id}`,
    toEmail: o.to_email,
    subject: o.subject,
    body: o.body,
    status: o.status,
    error: o.error,
    createdAt: o.created_at,
    sentAt: o.sent_at,
  }));

  return (
    <>
      <Topbar
        title="Pipeline de vendas"
        description={
          error
            ? "Erro ao carregar — rode a migration 0006"
            : `${leads.length} leads · vendas_leads`
        }
      />
      <PipelineBoard
        leads={leads}
        statuses={statuses}
        canManage={canManage}
        loadError={error?.message ?? null}
        canvas={canvas}
        outreach={outreach}
      />
    </>
  );
}
