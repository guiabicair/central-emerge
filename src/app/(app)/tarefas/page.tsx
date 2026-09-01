import { Topbar } from "@/components/layout/topbar";
import { TaskList } from "@/components/tarefas/task-list";
import { TASKS } from "@/lib/mock-data";

export const metadata = { title: "Tarefas · Central Emerge" };

export default function TarefasPage() {
  const abertas = TASKS.filter((t) => t.status !== "concluida").length;

  return (
    <>
      <Topbar
        title="Tarefas"
        description={`${abertas} tarefas abertas — equipe Emerge`}
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <TaskList tasks={TASKS} />
      </div>
    </>
  );
}
