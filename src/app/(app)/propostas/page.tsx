import { ComingSoon } from "@/components/coming-soon";
import { Topbar } from "@/components/layout/topbar";

export const metadata = { title: "Propostas · Central Emerge" };

export default function Page() {
  return (
    <>
      <Topbar title="Propostas" />
      <ComingSoon area="Propostas" />
    </>
  );
}
