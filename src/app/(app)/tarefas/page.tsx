import { ComingSoon } from "@/components/coming-soon";
import { Topbar } from "@/components/layout/topbar";

export const metadata = { title: "Tarefas · Central Emerge" };

export default function Page() {
  return (
    <>
      <Topbar title="Tarefas" />
      <ComingSoon area="Tarefas" />
    </>
  );
}
