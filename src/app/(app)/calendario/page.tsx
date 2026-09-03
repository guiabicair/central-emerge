import { CalendarBoard, type DayItem } from "@/components/calendario/calendar-board";
import { Topbar } from "@/components/layout/topbar";
import { can } from "@/lib/auth/roles";
import { addMonths, monthMatrix, startOfMonth, ymd } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Calendário · Central Emerge" };

/**
 * Calendário REAL — lê calendar_events + os prazos (due_date) de tasks no mês.
 * Read-only nesta fatia (criar/editar evento fica pra depois). Sem coluna nova.
 */

const COLOR_TOKEN: Record<string, string> = {
  blue: "var(--wip)",
  green: "var(--done)",
  teal: "var(--data)",
  red: "var(--gap)",
  rose: "var(--gap)",
  orange: "var(--warn)",
  yellow: "var(--warn)",
  amber: "var(--warn)",
  purple: "var(--auto)",
  violet: "var(--auto)",
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  meeting: "Reunião",
  deadline: "Prazo",
  reminder: "Lembrete",
  holiday: "Feriado",
  other: "Evento",
};

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonth(m: string | undefined): Date {
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split("-").map(Number);
    return new Date(y, mo - 1, 1);
  }
  return startOfMonth(new Date());
}

function timeOf(iso: string): string | null {
  const d = new Date(iso);
  if (d.getHours() === 0 && d.getMinutes() === 0) return null;
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

function monthOf(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const sp = await searchParams;
  const monthStart = parseMonth(sp.m);
  const monthKey = fmt(monthStart);

  const weeks = monthMatrix(monthStart);
  const gridDays = weeks.flat();
  const gridEndExclusive = new Date(gridDays.at(-1)!);
  gridEndExclusive.setDate(gridEndExclusive.getDate() + 1);
  const isoStart = ymd(gridDays[0]!);
  const isoEnd = ymd(gridEndExclusive);

  const supabase = await createClient();
  const [canView, canTasks] = await Promise.all([
    can("calendario.view"),
    can("tarefas.view"),
  ]);

  const empty = Promise.resolve({ data: [], error: null } as const);
  const [evRes, taskRes, lastEvRes, lastTaskRes] = await Promise.all([
    canView
      ? supabase
          .from("calendar_events")
          .select(
            "id, title, start_date, event_type, task_id, color, is_all_day",
          )
          .gte("start_date", isoStart)
          .lt("start_date", isoEnd)
          .order("start_date")
      : empty,
    canView && canTasks
      ? supabase
          .from("tasks")
          .select("id, title, status, priority, due_date")
          .not("due_date", "is", null)
          .gte("due_date", isoStart)
          .lt("due_date", isoEnd)
          .order("due_date")
      : empty,
    canView
      ? supabase
          .from("calendar_events")
          .select("start_date")
          .order("start_date", { ascending: false })
          .limit(1)
      : empty,
    canView && canTasks
      ? supabase
          .from("tasks")
          .select("due_date")
          .not("due_date", "is", null)
          .order("due_date", { ascending: false })
          .limit(1)
      : empty,
  ]);

  const loadError = canView ? (evRes.error?.message ?? null) : null;

  const byDay: Record<string, DayItem[]> = {};
  const push = (key: string, item: DayItem) => {
    (byDay[key] ??= []).push(item);
  };

  for (const e of (evRes.data ?? []) as {
    id: string;
    title: string;
    start_date: string;
    event_type: string;
    task_id: string | null;
    color: string | null;
    is_all_day: boolean;
  }[]) {
    push(ymd(new Date(e.start_date)), {
      kind: "event",
      id: e.id,
      title: e.title,
      time: e.is_all_day ? null : timeOf(e.start_date),
      color: COLOR_TOKEN[(e.color ?? "").toLowerCase()] ?? "var(--data)",
      meta: EVENT_TYPE_LABEL[e.event_type] ?? e.event_type,
      href: e.task_id ? "/tarefas" : null,
    });
  }

  for (const t of (taskRes.data ?? []) as {
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string;
  }[]) {
    const done = t.status === "completed" || t.status === "cancelled";
    push(ymd(new Date(t.due_date)), {
      kind: "task",
      id: t.id,
      title: t.title,
      time: timeOf(t.due_date),
      color: done ? "var(--ink-muted)" : "var(--action)",
      meta: done ? "prazo · encerrada" : "prazo",
      href: "/tarefas",
    });
  }

  for (const items of Object.values(byDay)) {
    items.sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));
  }

  const lastEv = monthOf(
    ((lastEvRes.data ?? [])[0] as { start_date?: string } | undefined)
      ?.start_date,
  );
  const lastTask = monthOf(
    ((lastTaskRes.data ?? [])[0] as { due_date?: string } | undefined)?.due_date,
  );
  const latestMonth =
    [lastEv, lastTask]
      .filter((x): x is string => !!x)
      .sort()
      .at(-1) ?? null;

  return (
    <>
      <Topbar
        title="Calendário"
        description="Eventos da equipe + prazos de tarefas no mês"
      />
      {!canView ? (
        <div className="flex-1 p-6">
          <div className="border-line bg-surface rounded-2xl border p-6 text-sm">
            Você não tem acesso ao calendário.
          </div>
        </div>
      ) : loadError ? (
        <div className="flex-1 p-6">
          <div className="border-line bg-surface rounded-2xl border p-6 text-sm">
            <p className="font-medium">
              Não foi possível carregar o calendário.
            </p>
            <p className="text-ink-muted mt-1">
              Falta a bridge de RLS de <code>calendar_events</code>. Detalhe:{" "}
              {loadError}
            </p>
          </div>
        </div>
      ) : (
        <CalendarBoard
          monthKey={monthKey}
          gridDays={gridDays.map((d) => ymd(d))}
          itemsByDay={byDay}
          prevM={fmt(addMonths(monthStart, -1))}
          nextM={fmt(addMonths(monthStart, 1))}
          thisM={fmt(startOfMonth(new Date()))}
          latestMonth={latestMonth}
          showTasksLayer={canTasks}
        />
      )}
    </>
  );
}
