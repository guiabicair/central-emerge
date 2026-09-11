import { Topbar } from "@/components/layout/topbar";
import { TasksBoard, type TaskRow } from "@/components/tarefas/tasks-board";
import { can } from "@/lib/auth/roles";
import { getCanvasSnapshot } from "@/lib/canvas/queries";
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
  agent_name: string | null;
}

interface SubtaskDb {
  id: string;
  parent_task_id: string;
  title: string;
  status: string;
}

interface CommentDb {
  id: string;
  task_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
}
interface DeliveryDb {
  id: string;
  task_id: string;
  submitted_by: string | null;
  drive_folder_url: string | null;
  description: string | null;
  status: string;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  feedback: string | null;
}
interface TimeEntryDb {
  id: string;
  task_id: string;
  user_id: string | null;
  start_time: string;
  end_time: string | null;
  is_active: boolean;
}
interface TemplateDb {
  id: string;
  title: string;
  description: string | null;
  estimated_hours: number | null;
  priority: string;
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
    commentsRes,
    deliveriesRes,
    timeRes,
    templatesRes,
    canManage,
    canvas,
  ] = await Promise.all([
    db
      .from("tasks")
      .select(
        "id, title, description, briefing, status, priority, client_id, due_date, drive_link, figma_link, agent_name",
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
    db
      .from("task_comments")
      .select("id, task_id, user_id, content, created_at")
      .order("created_at"),
    db
      .from("task_deliveries")
      .select(
        "id, task_id, submitted_by, drive_folder_url, description, status, submitted_at, reviewed_by, reviewed_at, feedback",
      )
      .order("submitted_at"),
    db
      .from("time_entries")
      .select("id, task_id, user_id, start_time, end_time, is_active"),
    db
      .from("task_templates")
      .select("id, title, description, estimated_hours, priority")
      .order("created_at"),
    can("tarefas.manage"),
    getCanvasSnapshot("tarefas"),
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

  const uname = (id: string | null) => (id ? (nameByUser.get(id) ?? "—") : "—");

  const commentsByTask = new Map<string, TaskRow["comments"]>();
  for (const c of (commentsRes.data ?? []) as CommentDb[]) {
    const arr = commentsByTask.get(c.task_id) ?? [];
    arr.push({
      id: c.id,
      author: uname(c.user_id),
      isMine: c.user_id === user?.id,
      content: c.content,
      at: c.created_at,
    });
    commentsByTask.set(c.task_id, arr);
  }

  const delByTask = new Map<string, TaskRow["deliveries"]>();
  for (const d of (deliveriesRes.data ?? []) as DeliveryDb[]) {
    const arr = delByTask.get(d.task_id) ?? [];
    arr.push({
      id: d.id,
      driveUrl: d.drive_folder_url,
      description: d.description,
      status: d.status,
      submittedBy: uname(d.submitted_by),
      submittedAt: d.submitted_at,
      reviewedBy: d.reviewed_by ? uname(d.reviewed_by) : null,
      reviewedAt: d.reviewed_at,
      feedback: d.feedback,
    });
    delByTask.set(d.task_id, arr);
  }

  const loggedByTask = new Map<string, number>();
  const intervalsByTask = new Map<string, TaskRow["timeIntervals"]>();
  const activeTimerByTask = new Map<string, { id: string; startTime: string }>();
  for (const e of (timeRes.data ?? []) as TimeEntryDb[]) {
    if (e.is_active && e.user_id === user?.id) {
      activeTimerByTask.set(e.task_id, { id: e.id, startTime: e.start_time });
    }
    if (e.end_time) {
      const secs =
        (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) /
        1000;
      if (secs > 0) {
        loggedByTask.set(e.task_id, (loggedByTask.get(e.task_id) ?? 0) + secs);
        const arr = intervalsByTask.get(e.task_id) ?? [];
        arr.push({
          id: e.id,
          start: e.start_time,
          seconds: Math.round(secs),
          mine: e.user_id === user?.id,
        });
        intervalsByTask.set(e.task_id, arr);
      }
    }
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
    agentName: t.agent_name ?? null,
    assignees: assigneesByTask.get(t.id) ?? [],
    assigneeNames: (assigneesByTask.get(t.id) ?? []).map(
      (u) => nameByUser.get(u) ?? "—",
    ),
    subtasks: subByTask.get(t.id) ?? [],
    archived: archivedSet.has(t.id),
    comments: commentsByTask.get(t.id) ?? [],
    deliveries: delByTask.get(t.id) ?? [],
    loggedSeconds: Math.round(loggedByTask.get(t.id) ?? 0),
    activeTimer: activeTimerByTask.get(t.id) ?? null,
    timeIntervals: intervalsByTask.get(t.id) ?? [],
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

  const templates = ((templatesRes.data ?? []) as TemplateDb[]).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    estimatedHours: t.estimated_hours,
    priority: t.priority,
  }));

  return (
    <>
      <Topbar
        title="Tarefas"
        description={
          loadError
            ? "Erro ao carregar — rode a migration 0007"
            : "Kanban, lista, calendário, cronograma e nós"
        }
      />
      <TasksBoard
        tasks={tasks}
        statuses={statuses}
        people={people}
        clients={clients}
        clientFilterOptions={clientFilterOptions}
        templates={templates}
        currentUserId={user?.id ?? null}
        canManage={canManage}
        loadError={loadError}
        canvas={canvas}
      />
    </>
  );
}
