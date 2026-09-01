import { ClientsTable } from "@/components/clientes/clients-table";
import { Topbar } from "@/components/layout/topbar";
import { CLIENTS } from "@/lib/mock-data";

export const metadata = { title: "Clientes · Central Emerge" };

export default function ClientesPage() {
  return (
    <>
      <Topbar
        title="Clientes"
        description={`${CLIENTS.length} clientes — gestão de contratos fechados`}
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <ClientsTable clients={CLIENTS} />
      </div>
    </>
  );
}
