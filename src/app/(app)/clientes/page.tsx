import { Topbar } from "@/components/layout/topbar";
import { ClientsView } from "@/components/clientes/clients-view";
import { can } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Clientes · Central Emerge" };

const DONE_PROJECT_STATUS = ["completed", "done", "cancelled", "canceled", "archived"];

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ teste?: string }>;
}) {
  const { teste } = await searchParams;
  const showTest = teste === "1";

  const supabase = await createClient();

  const clientsQuery = supabase
    .from("clients")
    .select(
      "id, name, segment, mrr, status, contact_name, email, phone, notes, is_seed",
    )
    .order("mrr", { ascending: false })
    .order("name");

  const [{ data: clientsData, error }, canManage, recurring, specific] =
    await Promise.all([
      showTest ? clientsQuery : clientsQuery.eq("is_seed", true),
      can("clientes.manage"),
      supabase
        .from("recurring_projects")
        .select("client_id, status")
        .eq("status", "active"),
      supabase.from("specific_projects").select("client_id, status"),
    ]);

  const activeProjects = new Map<string, number>();
  for (const r of recurring.data ?? []) {
    if (r.client_id)
      activeProjects.set(r.client_id, (activeProjects.get(r.client_id) ?? 0) + 1);
  }
  for (const s of specific.data ?? []) {
    if (s.client_id && !DONE_PROJECT_STATUS.includes(s.status ?? ""))
      activeProjects.set(s.client_id, (activeProjects.get(s.client_id) ?? 0) + 1);
  }

  const clients = (clientsData ?? []).map((c) => ({
    ...c,
    activeProjects: activeProjects.get(c.id) ?? 0,
  }));

  return (
    <>
      <Topbar
        title="Clientes"
        description={
          error
            ? "Erro ao carregar — rode a migration 0003"
            : `${clients.length} ${clients.length === 1 ? "cliente" : "clientes"}`
        }
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <ClientsView
          clients={clients}
          canManage={canManage}
          showTest={showTest}
          loadError={error?.message ?? null}
        />
      </div>
    </>
  );
}
