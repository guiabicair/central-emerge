import { ComingSoon } from "@/components/coming-soon";
import { Topbar } from "@/components/layout/topbar";

export const metadata = { title: "Financeiro · Central Emerge" };

export default function Page() {
  return (
    <>
      <Topbar title="Financeiro" />
      <ComingSoon area="Financeiro" />
    </>
  );
}
