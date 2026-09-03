import { Topbar } from "@/components/layout/topbar";
import { PipelineBoard, type LeadRow } from "@/components/pipeline/pipeline-board";
import { can } from "@/lib/auth/roles";
import { getCanvasSnapshot } from "@/lib/canvas/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Pipeline · Central Emerge" };

export default async function PipelinePage() {
  const supabase = await createClient();

  const [{ data, error }, canManage, canvas] = await Promise.all([
    supabase
      .from("vendas_leads")
      .select(
        "id, empresa, frente, segmento, contato, origem, valor_estimado, responsavel, status, motivo_fit, criado_por, criado_em",
      )
      .order("atualizado_em", { ascending: false }),
    can("pipeline.manage"),
    getCanvasSnapshot("pipeline"),
  ]);

  const leads = (data ?? []) as LeadRow[];

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
        canManage={canManage}
        loadError={error?.message ?? null}
        canvas={canvas}
      />
    </>
  );
}
