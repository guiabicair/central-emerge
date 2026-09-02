import { Topbar } from "@/components/layout/topbar";
import { EquipeTabs } from "@/components/equipe/equipe-tabs";
import { RolesEditor } from "@/components/equipe/roles-editor";
import { listPermissions, listRoles, requirePermission } from "@/lib/auth/roles";

export const metadata = { title: "Papéis · Central Emerge" };

export default async function PapeisPage() {
  await requirePermission("equipe.manage_roles");

  const [roles, permissions] = await Promise.all([
    listRoles(),
    listPermissions(),
  ]);

  return (
    <>
      <Topbar
        title="Papéis & permissões"
        description={`${roles.length} papéis · ${permissions.length} permissões`}
      />
      <EquipeTabs canManageRoles />
      <div className="flex-1 overflow-y-auto">
        <RolesEditor roles={roles} permissions={permissions} />
      </div>
    </>
  );
}
