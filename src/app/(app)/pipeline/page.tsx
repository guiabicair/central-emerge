import { Topbar } from "@/components/layout/topbar";
import {
  PipelineBoard,
  type LeadRow,
  type LeadReplyRow,
} from "@/components/pipeline/pipeline-board";
import type { OutreachRow } from "@/components/pipeline/outreach-panel";
import { can } from "@/lib/auth/roles";
import { getCanvasSnapshot } from "@/lib/canvas/queries";
import { createClient, createUntypedClient } from "@/lib/supabase/server";

export const metadata = { title: "Pipeline · Central Emerge" };

// PostgREST/Supabase limita cada SELECT a no máx. ~1000 linhas por padrão —
// com >1000 leads (e outreach_messages crescendo do mesmo jeito), uma query
// simples corta silenciosamente os mais antigos. Pagina em blocos até
// esgotar, em vez de confiar num único .select().
const PAGE_SIZE = 1000;

type SupaPage<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

async function fetchAll<T>(build: (from: number, to: number) => SupaPage<T>): Promise<{
  data: T[];
  error: unknown;
}> {
  const all: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await build(from, from + PAGE_SIZE - 1);
    if (error) return { data: all, error };
    const page = (data ?? []) as T[];
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return { data: all, error: null };
}

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

interface LeadReplyDb {
  id: string;
  lead_id: number;
  classificacao: LeadReplyRow["classificacao"];
  resumo: string;
  from_email: string | null;
  received_at: string;
  prazo_data: string | null;
}

export default async function PipelinePage() {
  const supabase = await createClient();
  const db = await createUntypedClient();

  const [
    { data, error },
    statusesRes,
    { data: outreachData },
    { data: repliesData },
    canManage,
    canvas,
  ] = await Promise.all([
    fetchAll<LeadRow>((from, to) =>
      supabase
        .from("vendas_leads")
        .select(
          "id, empresa, unidade, frente, segmento, contato, origem, valor_estimado, responsavel, status, motivo_fit, proposta_slug, criado_por, criado_em",
        )
        .order("atualizado_em", { ascending: false })
        .range(from, to),
    ),
    db.from("lead_statuses").select("id, name, color, position").order("position"),
    fetchAll<OutreachDb>((from, to) =>
      db
        .from("outreach_messages")
        .select("id, lead_id, to_email, subject, body, status, error, created_at, sent_at")
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
    fetchAll<LeadReplyDb>((from, to) =>
      db
        .from("lead_replies")
        .select("id, lead_id, classificacao, resumo, from_email, received_at, prazo_data")
        .order("received_at", { ascending: false })
        .range(from, to),
    ),
    can("pipeline.manage"),
    getCanvasSnapshot("pipeline"),
  ]);

  const leads = data;
  const statuses = (statusesRes.data ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    color: (s.color as string) ?? "slate",
    position: (s.position as number) ?? 0,
  }));

  const empresaByLeadId = new Map(leads.map((l) => [l.id, l.empresa]));
  const unidadeByLeadId = new Map(leads.map((l) => [l.id, l.unidade]));
  const outreach: OutreachRow[] = (outreachData ?? []).map((o) => ({
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

  const replies: LeadReplyRow[] = (repliesData ?? []).map((r) => ({
    id: r.id,
    leadId: r.lead_id,
    classificacao: r.classificacao,
    resumo: r.resumo,
    fromEmail: r.from_email,
    receivedAt: r.received_at,
    prazoData: r.prazo_data,
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
        loadError={error ? "Erro ao carregar leads." : null}
        canvas={canvas}
        outreach={outreach}
        replies={replies}
      />
    </>
  );
}
