import { CalendarView } from "@/components/calendario/calendar-view";
import { Topbar } from "@/components/layout/topbar";

export const metadata = { title: "Calendário · Central Emerge" };

export default function CalendarioPage() {
  return (
    <>
      <Topbar
        title="Calendário"
        description="Tarefas por dia — filtre por pessoa ou projeto"
      />
      <CalendarView />
    </>
  );
}
