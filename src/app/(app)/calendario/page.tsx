import { CalendarBoard, type DayItem } from "@/components/calendario/calendar-board";
import { Topbar } from "@/components/layout/topbar";
import { can } from "@/lib/auth/roles";
import {
  addMonths,
  brtParts,
  monthMatrix,
  startOfMonth,
  ymd,
} from "@/lib/calendar";
import { createClient, createUntypedClient } from "@/lib/supabase/server";

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

// conversão pra fuso de São Paulo (BUG#9) — helper compartilhado em lib/calendar
const brt = brtParts;

function monthOf(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return brt(iso).day.slice(0, 7);
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
  const gridDaySet = new Set(gridDays.map((d) => ymd(d)));
  // janela de busca com folga de 1 dia de cada lado: BRT é UTC-3, então um
  // item do último dia visível pode estar gravado até 02:59Z do dia seguinte.
  const winStart = new Date(gridDays[0]!);
  winStart.setDate(winStart.getDate() - 1);
  const winEnd = new Date(gridDays.at(-1)!);
  winEnd.setDate(winEnd.getDate() + 2);
  const isoStart = ymd(winStart);
  const isoEnd = ymd(winEnd);

  const supabase = await createClient();
  const db = await createUntypedClient();
  const [canView, canTasks, canClientes] = await Promise.all([
    can("calendario.view"),
    can("tarefas.view"),
    can("clientes.view"),
  ]);

  const empty = Promise.resolve({ data: [], error: null } as const);
  const [evRes, taskRes, cronoRes, lastEvRes, lastTaskRes] = await Promise.all([
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
    canView && canClientes
      ? db
          .from("app_cronograma_itens")
          .select(
            "id, text, status, date, cronograma_id, app_cronogramas(client_id, title)",
          )
          .not("date", "is", null)
          .gte("date", isoStart)
          .lt("date", isoEnd)
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
    if (!gridDaySet.has(key)) return; // item que caiu fora da grade visível
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
    const b = brt(e.start_date);
    push(b.day, {
      kind: "event",
      id: e.id,
      title: e.title,
      time: e.is_all_day || b.hm === "00:00" ? null : b.hm,
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
    // due_date é um prazo (fim do dia), não um horário marcado — sem hora.
    push(brt(t.due_date).day, {
      kind: "task",
      id: t.id,
      title: t.title,
      time: null,
      color: done ? "var(--ink-muted)" : "var(--action)",
      meta: done ? "prazo · encerrada" : "prazo",
      href: "/tarefas",
    });
  }

  for (const raw of (cronoRes.data ?? []) as unknown[]) {
    const it = raw as {
      id: string;
      text: string;
      status: string;
      date: string;
      cronograma_id: string;
      app_cronogramas?:
        | { client_id: string | null; title: string }
        | { client_id: string | null; title: string }[]
        | null;
    };
    const crono = Array.isArray(it.app_cronogramas)
      ? it.app_cronogramas[0]
      : it.app_cronogramas;
    // date é coluna DATE (não timestamptz) — o dia já é o dia, sem fuso.
    const done = it.status === "concluido";
    push(it.date, {
      kind: "task",
      id: it.id,
      title: it.text,
      time: null,
      color: done ? "var(--ink-muted)" : "var(--auto)",
      meta: `cronograma${crono?.title ? ` · ${crono.title}` : ""}`,
      href: crono?.client_id
        ? `/clientes/${crono.client_id}/cronograma/${it.cronograma_id}`
        : null,
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
