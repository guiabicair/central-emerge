import { ComingSoon } from "@/components/coming-soon";
import { Topbar } from "@/components/layout/topbar";

export const metadata = { title: "Calendário · Central Emerge" };

export default function Page() {
  return (
    <>
      <Topbar title="Calendário" />
      <ComingSoon area="Calendário" />
    </>
  );
}
