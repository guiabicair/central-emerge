import { Topbar } from "@/components/layout/topbar";
import { RecursosTabs } from "@/components/equipe/recursos-tabs";
import { AccessVault, type AccessItem } from "@/components/equipe/access-vault";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/auth/roles";

export const metadata = { title: "Acessos · Central Emerge" };

export default async function AcessosPage() {
  const supabase = await createClient();
  const [{ data }, canManage] = await Promise.all([
    supabase
      .from("platform_access")
      .select(
        "id, platform_name, category, login_url, username, password, description, additional_info, is_active",
      )
      .order("platform_name"),
    can("recursos.manage"),
  ]);

  const items = (data ?? []) as AccessItem[];

  return (
    <>
      <Topbar
        title="Recursos"
        description={`Cofre de acessos — ${items.length} plataformas`}
      />
      <RecursosTabs />
      <div className="flex-1 overflow-y-auto">
        <AccessVault items={items} canManage={canManage} />
      </div>
    </>
  );
}
