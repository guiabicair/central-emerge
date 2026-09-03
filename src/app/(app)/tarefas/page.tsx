import { Topbar } from "@/components/layout/topbar";
import { TasksBoard, type TaskRow } from "@/components/tarefas/tasks-board";
import { can } from "@/lib/auth/roles";
import { getUser } from "@/lib/supabase/auth";
import { createClient, createUntypedClient } from "@/lib/supabase/server";

export const metadata = { title: "Tarefas · Central Emerge" };

interface TaskDb {
  id: string;
  title: string;
  description: string | null;
  briefing: string | null;
  status: string;
  priority: string;
  client_id: string | null;
  due_date: string | null;
  drive_link: string | null;
  figma_link: string | null;
}

interface SubtaskDb {
  id: string;
  parent_task_id: string;
  title: string;
  status: string;
}

export default async function TarefasPage() {
  const supabase = await createClient();
  const db = await createUntypedClient();
  const user = await getUser();

  const [
    tasksRes,
    assigneesRes,
    subtasksRes,
    statusesRes,
    profilesRes,
    clientsRes,
    canManage,
  ] = await Promise.all([
    db
      .from("tasks")
      .select(
        "id, title, description, briefing, status, priority, client_id, due_date, drive_link, figma_link",
      )
      .order("updated_at", { ascending: false }),
    supabase.from("task_assignees").select("task_id, user_id"),
    db
      .from("subtasks")
      .select("id, parent_task_id, title, status")
      .order("created_at"),
    supabase
      .from("task_statuses")
      .select("id, name, color, position")
      .order("position"),
    supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("approval_status", "approved"),
    supabase.from("clients").select("id, name, is_seed").order("name"),
    can("tarefas.manage"),
  ]);

  const loadError =
    tasksRes.error?.message ??
    assigneesRes.error?.message ??
    statusesRes.error?.message ??
    null;

  // archived é da 0013 — query separada e tolerante (pré-migration = tudo false)
  const archivedSet = new Set<string>();
  try {
    const { data } = await db
      .from("tasks")
      .select("id")
      .eq("archived", true);
    for (const r of (data ?? []) as { id: string }[]) archivedSet.add(r.id);
  } catch {
    /* coluna ainda não existe */
  }

  const statuses = (statusesRes.data ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
    color: (s.color as string) ?? "slate",
    position: (s.position as number) ?? 0,
  }));

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

  const subByTask = new Map<
    string,
    { id: string; title: string; done: boolean }[]
  >();
  for (const s of (subtasksRes.data ?? []) as SubtaskDb[]) {
    const arr = subByTask.get(s.parent_task_id) ?? [];
    arr.push({ id: s.id, title: s.title, done: s.status === "completed" });
    subByTask.set(s.parent_task_id, arr);
  }

  const tasks: TaskRow[] = ((tasksRes.data ?? []) as TaskDb[]).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    briefing: t.briefing ?? null,
    status: t.status,
    priority: t.priority,
    clientId: t.client_id,
    clientName: t.client_id ? (nameByClient.get(t.client_id) ?? null) : null,
    dueDate: t.due_date,
    driveLink: t.drive_link ?? null,
    figmaLink: t.figma_link ?? null,
    assignees: assigneesByTask.get(t.id) ?? [],
    assigneeNames: (assigneesByTask.get(t.id) ?? []).map(
      (u) => nameByUser.get(u) ?? "—",
    ),
    subtasks: subByTask.get(t.id) ?? [],
    archived: archivedSet.has(t.id),
  }));

  const people = (profilesRes.data ?? []).map((p) => ({
    id: p.user_id,
    name: p.full_name ?? "—",
  }));
  // dropdown do form: só clientes curados (steer de novas atribuições — BUG#7)
  const clients = (clientsRes.data ?? [])
    .filter((c) => c.is_seed)
    .map((c) => ({ id: c.id, name: c.name }));
  // dropdown do FILTRO: clientes que as tasks realmente usam (inclui legado),
  // senão o filtro Cliente nunca casa (BUG#12)
  const clientFilterOptions = [
    ...new Set(
      tasks.map((t) => t.clientId).filter((id): id is string => !!id),
    ),
  ]
    .map((id) => ({ id, name: nameByClient.get(id) ?? "Cliente legado" }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <Topbar
        title="Tarefas"
        description={
          loadError
            ? "Erro ao carregar — rode a migration 0007"
            : `${tasks.filter((t) => !t.archived).length} tarefas`
        }
      />
      <TasksBoard
        tasks={tasks}
        statuses={statuses}
        people={people}
        clients={clients}
        clientFilterOptions={clientFilterOptions}
        currentUserId={user?.id ?? null}
        canManage={canManage}
        loadError={loadError}
      />
    </>
  );
}
