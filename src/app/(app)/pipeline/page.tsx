import { Topbar } from "@/components/layout/topbar";
import { PipelineView } from "@/components/pipeline/pipeline-view";
import { LEADS } from "@/lib/mock-data";

export const metadata = { title: "Pipeline · Central Emerge" };

export default function PipelinePage() {
  return (
    <>
      <Topbar
        title="Pipeline de vendas"
        description={`Prospecção organizada — ${LEADS.length} leads no funil`}
      />
      <PipelineView leads={LEADS} />
    </>
  );
}
