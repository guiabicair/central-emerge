import { notFound } from "next/navigation";

import { Topbar } from "@/components/layout/topbar";
import { CronogramaView } from "@/components/clientes/cronograma-view";
import { can } from "@/lib/auth/roles";
import { getCronogramaFull } from "@/lib/cronogramas/queries";

export const metadata = { title: "Cronograma · Central Emerge" };

export default async function CronogramaPage({
  params,
}: {
  params: Promise<{ id: string; cid: string }>;
}) {
  const { id, cid } = await params;
  if (!(await can("clientes.view"))) {
    return (
      <>
        <Topbar title="Cronograma" />
        <div className="flex-1 p-6">
          <div className="border-line bg-surface rounded-2xl border p-6 text-sm">
            Você não tem acesso.
          </div>
        </div>
      </>
    );
  }

  const crono = await getCronogramaFull(cid);
  if (!crono || (crono.clientId && crono.clientId !== id)) notFound();

  const canManage = await can("clientes.manage");

  return (
    <>
      <Topbar title={crono.title} description="Cronograma do cliente" />
      <CronogramaView crono={crono} canManage={canManage} />
    </>
  );
}
