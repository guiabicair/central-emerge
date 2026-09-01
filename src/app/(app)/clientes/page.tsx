import { ComingSoon } from "@/components/coming-soon";
import { Topbar } from "@/components/layout/topbar";

export const metadata = { title: "Clientes · Central Emerge" };

export default function Page() {
  return (
    <>
      <Topbar title="Clientes" />
      <ComingSoon area="Clientes" />
    </>
  );
}
