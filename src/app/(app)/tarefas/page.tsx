import { Topbar } from "@/components/layout/topbar";
import { TasksBoard, type TaskRow } from "@/components/tarefas/tasks-board";
import { can } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Tarefas · Central Emerge" };

export default async function TarefasPage() {
  const supabase = await createClient();

  const [tasksRes, assigneesRes, profilesRes, clientsRes, canManage] =
    await Promise.all([
      supabase
        .from("tasks")
        .select(
          "id, title, description, status, priority, client_id, due_date, created_at",
        )
        .order("updated_at", { ascending: false }),
      supabase.from("task_assignees").select("task_id, user_id"),
      supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("approval_status", "approved"),
      supabase.from("clients").select("id, name"),
      can("tarefas.manage"),
    ]);

  const loadError =
    tasksRes.error?.message ?? assigneesRes.error?.message ?? null;

  const nameByUser = new Map(
    (profilesRes.data ?? []).map((p) => [p.user_id, p.full_name ?? "—"]),
  );
  const nameByClient = new Map(
    (clientsRes.data ?? []).map((c) => [c.id, c.name]),
  );
  const assigneesByTask = new Map<string, string[]>();
  for (const a of assigneesRes.data ?? []) {
    const arr = assigneesByTask.get(a.task_id) ?? [];
    arr.push(a.user_id);
    assigneesByTask.set(a.task_id, arr);
  }

  const tasks: TaskRow[] = (tasksRes.data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    clientId: t.client_id,
    clientName: t.client_id ? (nameByClient.get(t.client_id) ?? null) : null,
    dueDate: t.due_date,
    assignees: assigneesByTask.get(t.id) ?? [],
    assigneeNames: (assigneesByTask.get(t.id) ?? []).map(
      (u) => nameByUser.get(u) ?? "—",
    ),
  }));

  const people = (profilesRes.data ?? []).map((p) => ({
    id: p.user_id,
    name: p.full_name ?? "—",
  }));
  const clients = (clientsRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <>
      <Topbar
        title="Tarefas"
        description={
          loadError
            ? "Erro ao carregar — rode a migration 0007"
            : `${tasks.length} tarefas · dados existentes`
        }
      />
      <TasksBoard
        tasks={tasks}
        people={people}
        clients={clients}
        canManage={canManage}
        loadError={loadError}
      />
    </>
  );
}
