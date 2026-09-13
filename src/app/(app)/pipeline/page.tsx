import { Topbar } from "@/components/layout/topbar";
import { PipelineBoard, type LeadRow } from "@/components/pipeline/pipeline-board";
import { can } from "@/lib/auth/roles";
import { getCanvasSnapshot } from "@/lib/canvas/queries";
import { createClient, createUntypedClient } from "@/lib/supabase/server";

export const metadata = { title: "Pipeline · Central Emerge" };

export default async function PipelinePage() {
  const supabase = await createClient();
  const db = await createUntypedClient();

  const [{ data, error }, statusesRes, canManage, canvas] = await Promise.all([
    supabase
      .from("vendas_leads")
      .select(
        "id, empresa, frente, segmento, contato, origem, valor_estimado, responsavel, status, motivo_fit, proposta_slug, criado_por, criado_em",
      )
      .order("atualizado_em", { ascending: false }),
    db.from("lead_statuses").select("id, name, color, position").order("position"),
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
      />
    </>
  );
}
