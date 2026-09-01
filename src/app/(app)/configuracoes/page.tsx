import { ComingSoon } from "@/components/coming-soon";
import { Topbar } from "@/components/layout/topbar";

export const metadata = { title: "Configurações · Central Emerge" };

export default function Page() {
  return (
    <>
      <Topbar title="Configurações" />
      <ComingSoon area="Configurações" />
    </>
  );
}
