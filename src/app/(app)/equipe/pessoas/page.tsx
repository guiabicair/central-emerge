import { Topbar } from "@/components/layout/topbar";
import { EquipeTabs } from "@/components/equipe/equipe-tabs";
import { PeopleTable } from "@/components/equipe/people-table";
import { can, listRoles, listTeam } from "@/lib/auth/roles";

export const metadata = { title: "Pessoas · Central Emerge" };

export default async function PessoasPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  const [{ highlight }, members, roles, canApprove, canManageRoles] = await Promise.all([
    searchParams,
    listTeam(),
    listRoles(),
    can("equipe.approve_users"),
    can("equipe.manage_roles"),
  ]);

  const pendentes = members.filter((m) => m.approval_status === "pending").length;

  return (
    <>
      <Topbar
        title="Equipe"
        description={`${members.length} pessoas${pendentes ? ` · ${pendentes} aguardando aprovação` : ""}`}
      />
      <EquipeTabs canManageRoles={canManageRoles} />
      <div className="flex-1 overflow-y-auto">
        <PeopleTable
          members={members}
          roles={roles}
          canApprove={canApprove}
          canManageRoles={canManageRoles}
          highlightUserId={highlight}
        />
      </div>
    </>
  );
}
