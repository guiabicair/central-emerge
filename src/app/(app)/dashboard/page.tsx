import { ComingSoon } from "@/components/coming-soon";
import { Topbar } from "@/components/layout/topbar";

export const metadata = { title: "Dashboard · Central Emerge" };

export default function Page() {
  return (
    <>
      <Topbar title="Dashboard" />
      <ComingSoon area="Dashboard" />
    </>
  );
}
