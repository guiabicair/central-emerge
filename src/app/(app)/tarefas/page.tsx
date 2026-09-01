import { Topbar } from "@/components/layout/topbar";
import { TasksView } from "@/components/tarefas/tasks-view";
import { TASKS } from "@/lib/mock-data";
import { isAtrasada } from "@/lib/tasks";

export const metadata = { title: "Tarefas · Central Emerge" };

export default function TarefasPage() {
  const atrasadas = TASKS.filter(isAtrasada).length;

  return (
    <>
      <Topbar
        title="Tarefas"
        description={`${TASKS.length} tarefas — ${atrasadas} atrasadas · Kanban de produção`}
      />
      <TasksView />
    </>
  );
}
