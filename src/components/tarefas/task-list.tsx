import { PILL_HEX, StatusPill, type PillColor } from "@/components/status-pill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CLIENTS_BY_ID, TEAM_BY_ID } from "@/lib/mock-data";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { cn, dueLabel, formatDate } from "@/lib/utils";

const STATUS_ORDER: TaskStatus[] = [
  "atrasada",
  "pendente",
  "em-andamento",
  "concluida",
];

const STATUS_META: Record<TaskStatus, { label: string; color: PillColor }> = {
  atrasada: { label: "Atrasada", color: "rose" },
  pendente: { label: "Pendente", color: "slate" },
  "em-andamento": { label: "Em andamento", color: "blue" },
  concluida: { label: "Concluída", color: "green" },
};

const PRIORITY_META: Record<
  TaskPriority,
  { label: string; color: PillColor }
> = {
  urgente: { label: "Urgente", color: "rose" },
  alta: { label: "Alta", color: "amber" },
  media: { label: "Média", color: "blue" },
  baixa: { label: "Baixa", color: "slate" },
};

function TaskRow({ task }: { task: Task }) {
  const person = TEAM_BY_ID[task.responsavelId];
  const cliente = task.clienteId ? CLIENTS_BY_ID[task.clienteId] : undefined;
  const priority = PRIORITY_META[task.prioridade];
  const done = task.status === "concluida";
  const late = task.status === "atrasada";

  return (
    <div className="border-border hover:bg-muted/40 flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: PILL_HEX[priority.color] }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate text-sm font-medium",
            done && "text-muted-foreground line-through",
          )}
        >
          {task.titulo}
        </div>
        <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
          <span
            className={cn(late && "text-[#f87171]", done && "line-through")}
          >
            {dueLabel(task.prazo)} · {formatDate(task.prazo)}
          </span>
          {cliente && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{cliente.empresa}</span>
            </>
          )}
        </div>
      </div>

      <StatusPill color={priority.color} className="hidden sm:inline-flex">
        {priority.label}
      </StatusPill>

      <div className="hidden items-center gap-2 md:flex">
        <Avatar className="size-6">
          <AvatarFallback
            className="text-[10px] font-semibold"
            style={{
              backgroundColor: `${person?.cor ?? "#8b918f"}22`,
              color: person?.cor ?? "#8b918f",
            }}
          >
            {person?.iniciais ?? "--"}
          </AvatarFallback>
        </Avatar>
        <span className="text-muted-foreground w-24 truncate text-xs">
          {person?.nome ?? "—"}
        </span>
      </div>
    </div>
  );
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div className="flex flex-col gap-5">
      {STATUS_ORDER.map((status) => {
        const group = tasks.filter((t) => t.status === status);
        if (group.length === 0) return null;
        const meta = STATUS_META[status];

        return (
          <section
            key={status}
            className="border-border bg-card overflow-hidden rounded-2xl border"
          >
            <header className="border-border flex items-center gap-2 border-b px-4 py-2.5">
              <StatusPill color={meta.color}>{meta.label}</StatusPill>
              <span className="text-muted-foreground text-xs">
                {group.length}
              </span>
            </header>
            <div>
              {group.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
