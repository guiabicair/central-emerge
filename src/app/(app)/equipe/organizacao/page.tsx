import { Topbar } from "@/components/layout/topbar";
import { EquipeTabs } from "@/components/equipe/equipe-tabs";
import { OrgView } from "@/components/equipe/org-view";
import { can } from "@/lib/auth/roles";
import { getOrgCanvasPositions, getOrgData } from "@/lib/equipe/org-queries";

export const metadata = { title: "Organização · Central Emerge" };

export default async function OrganizacaoPage() {
  const [data, canManage, canvasPositions] = await Promise.all([
    getOrgData(),
    can("equipe.manage_roles"),
    getOrgCanvasPositions(),
  ]);

  const rootCount = data.companies.filter((c) => !c.parent_id).length;

  return (
    <>
      <Topbar
        title="Organização"
        description={`${data.companies.length} empresas${
          rootCount !== data.companies.length ? ` · ${rootCount} no topo` : ""
        } · ${data.teams.length} times`}
      />
      <EquipeTabs canManageRoles={canManage} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <OrgView
          data={data}
          canManage={canManage}
          canvasPositions={canvasPositions}
        />
      </div>
    </>
  );
}
