"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteTask,
  moveTaskStatus,
  saveTask,
} from "@/app/(app)/tarefas/actions";
import {
  TASK_PRIORITY,
  TASK_STATUS,
  type SubtaskInput,
  type TaskInput,
  type TaskPriorityReal,
  type TaskStatusReal,
} from "@/app/(app)/tarefas/task-constants";
import { StatusPill, type PillColor } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { actionError, formatDate } from "@/lib/utils";

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  briefing: string | null;
  status: string;
  priority: string;
  clientId: string | null;
  clientName: string | null;
  dueDate: string | null;
  driveLink: string | null;
  figmaLink: string | null;
  assignees: string[];
  assigneeNames: string[];
  subtasks: { id: string; title: string; done: boolean }[];
}

const DRAFT_PREFIX = "emerge:task-draft:";

function draftKey(id?: string) {
  return `${DRAFT_PREFIX}${id ?? "new"}`;
}
function loadDraft(initial: TaskInput): TaskInput {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(draftKey(initial.id));
    if (!raw) return initial;
    const d = JSON.parse(raw) as Partial<TaskInput>;
    return { ...initial, ...d, id: initial.id };
  } catch {
    return initial;
  }
}
function saveDraft(f: TaskInput) {
  try {
    window.localStorage.setItem(draftKey(f.id), JSON.stringify(f));
  } catch {
    /* localStorage indisponível — segue sem rascunho */
  }
}
function clearDraft(id?: string) {
  try {
    window.localStorage.removeItem(draftKey(id));
  } catch {
    /* ignore */
  }
}

const COLUMNS: { id: TaskStatusReal; label: string; dot: string }[] = [
  { id: "pending", label: "Pendente", dot: "var(--warn)" },
  { id: "in_progress", label: "Em andamento", dot: "var(--wip)" },
  { id: "completed", label: "Concluída", dot: "var(--done)" },
  { id: "cancelled", label: "Cancelada", dot: "var(--ink-muted)" },
];

const PRIORITY: Record<
  TaskPriorityReal,
  { label: string; color: PillColor }
> = {
  low: { label: "Baixa", color: "slate" },
  medium: { label: "Média", color: "blue" },
  high: { label: "Alta", color: "amber" },
  urgent: { label: "Urgente", color: "rose" },
};

const BLANK: TaskInput = {
  title: "",
  description: "",
  briefing: "",
  status: "pending",
  priority: "medium",
  clientId: null,
  dueDate: null,
  driveLink: "",
  figmaLink: "",
  assignees: [],
  subtasks: [],
};

const inputCls =
  "border-line-strong focus:border-data h-9 w-full rounded-md border bg-transparent px-2.5 text-sm outline-none";

function TaskForm({
  initial,
  people,
  clients,
  onClose,
}: {
  initial: TaskInput;
  people: { id: string; name: string }[];
  clients: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [form, setForm] = useState<TaskInput>(() => loadDraft(initial));
  const [hadDraft, setHadDraft] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !!window.localStorage.getItem(draftKey(initial.id));
    } catch {
      return false;
    }
  });
  const [pending, start] = useTransition();
  const set = <K extends keyof TaskInput>(k: K, v: TaskInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // rascunho: o form não perde o que foi digitado se fechar/recarregar
  useEffect(() => {
    saveDraft(form);
  }, [form]);

  const toggleAssignee = (id: string) =>
    set(
      "assignees",
      form.assignees.includes(id)
        ? form.assignees.filter((a) => a !== id)
        : [...form.assignees, id],
    );

  const addSub = () =>
    set("subtasks", [...form.subtasks, { title: "", done: false }]);
  const patchSub = (i: number, p: Partial<SubtaskInput>) =>
    set(
      "subtasks",
      form.subtasks.map((s, idx) => (idx === i ? { ...s, ...p } : s)),
    );
  const removeSub = (i: number) =>
    set(
      "subtasks",
      form.subtasks.filter((_, idx) => idx !== i),
    );

  const discardDraft = () => {
    clearDraft(initial.id);
    setForm(initial);
    setHadDraft(false);
  };

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.title.trim()) return toast.error("Título é obrigatório.");
        start(async () => {
          try {
            await saveTask(form);
            clearDraft(initial.id);
            toast.success(initial.id ? "Tarefa atualizada" : "Tarefa criada");
            onClose();
          } catch (err) {
            toast.error(actionError(err, "Falhou ao salvar"));
          }
        });
      }}
    >
      <SheetHeader className="border-line border-b p-5 pr-12">
        <SheetTitle className="text-base font-semibold">
          {initial.id ? "Editar tarefa" : "Nova tarefa"}
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {hadDraft && (
          <div className="border-line bg-surface-2/60 flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-[11px]">
            <span className="text-ink-muted">Rascunho recuperado.</span>
            <button
              type="button"
              onClick={discardDraft}
              className="text-data-text hover:underline"
            >
              Descartar
            </button>
          </div>
        )}
        <label className="block">
          <span className="text-ink-muted text-[11px] font-semibold uppercase">
            Título *
          </span>
          <input
            autoFocus
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={`mt-1 ${inputCls}`}
          />
        </label>
        <label className="block">
          <span className="text-ink-muted text-[11px] font-semibold uppercase">
            Descrição
          </span>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className="border-line-strong focus:border-data mt-1 w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none"
          />
        </label>
        <label className="block">
          <span className="text-ink-muted text-[11px] font-semibold uppercase">
            Briefing
          </span>
          <textarea
            value={form.briefing ?? ""}
            onChange={(e) => set("briefing", e.target.value)}
            rows={5}
            placeholder="Contexto completo, referências, requisitos, tom…"
            className="border-line-strong focus:border-data mt-1 w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Status
            </span>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as TaskStatusReal)}
              className={`mt-1 ${inputCls}`}
            >
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Prioridade
            </span>
            <select
              value={form.priority}
              onChange={(e) =>
                set("priority", e.target.value as TaskPriorityReal)
              }
              className={`mt-1 ${inputCls}`}
            >
              {TASK_PRIORITY.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY[p].label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Cliente
            </span>
            <select
              value={form.clientId ?? ""}
              onChange={(e) => set("clientId", e.target.value || null)}
              className={`mt-1 ${inputCls}`}
            >
              <option value="">— sem cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Prazo
            </span>
            <input
              type="date"
              value={form.dueDate ? form.dueDate.slice(0, 10) : ""}
              onChange={(e) => set("dueDate", e.target.value || null)}
              className={`mt-1 ${inputCls}`}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Link do Drive
            </span>
            <input
              type="text"
              inputMode="url"
              placeholder="https://drive.google.com/…"
              value={form.driveLink ?? ""}
              onChange={(e) => set("driveLink", e.target.value)}
              className={`mt-1 ${inputCls}`}
            />
          </label>
          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Link do Figma
            </span>
            <input
              type="text"
              inputMode="url"
              placeholder="https://figma.com/…"
              value={form.figmaLink ?? ""}
              onChange={(e) => set("figmaLink", e.target.value)}
              className={`mt-1 ${inputCls}`}
            />
          </label>
        </div>
        <div>
          <span className="text-ink-muted text-[11px] font-semibold uppercase">
            Responsáveis
          </span>
          <div className="border-line mt-1 max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
            {people.length === 0 && (
              <p className="text-ink-muted text-xs">Nenhum membro aprovado.</p>
            )}
            {people.map((p) => (
              <label
                key={p.id}
                className="hover:bg-surface-2 flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.assignees.includes(p.id)}
                  onChange={() => toggleAssignee(p.id)}
                  className="accent-[var(--data)]"
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Subtarefas
              {form.subtasks.length > 0 && (
                <span className="ml-1 normal-case">
                  ({form.subtasks.filter((s) => s.done).length}/
                  {form.subtasks.length})
                </span>
              )}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={addSub}
            >
              <Plus className="size-3" />
              Adicionar
            </Button>
          </div>
          <div className="mt-1 space-y-1.5">
            {form.subtasks.length === 0 && (
              <p className="text-ink-muted text-xs">Nenhuma subtarefa.</p>
            )}
            {form.subtasks.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.done}
                  onChange={() => patchSub(i, { done: !s.done })}
                  className="accent-[var(--data)]"
                  aria-label="Concluída"
                />
                <input
                  value={s.title}
                  onChange={(e) => patchSub(i, { title: e.target.value })}
                  placeholder="Descreva a subtarefa"
                  className={`border-line-strong focus:border-data h-8 flex-1 rounded-md border bg-transparent px-2 text-sm outline-none ${
                    s.done ? "text-ink-muted line-through" : ""
                  }`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeSub(i)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-line flex justify-end gap-2 border-t p-4">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

function DeleteDialog({
  task,
  onClose,
}: {
  task: TaskRow;
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
      <div className="border-line bg-surface w-full max-w-sm rounded-xl border p-5">
        <h3 className="text-sm font-semibold">Excluir “{task.title}”?</h3>
        <p className="text-ink-muted mt-1 text-sm">Não dá pra desfazer.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                try {
                  await deleteTask(task.id);
                  toast.success("Tarefa excluída");
                  onClose();
                } catch (err) {
                  toast.error(
                    actionError(err, "Falhou ao excluir"),
                  );
                }
              })
            }
          >
            <Trash2 className="size-3.5" />
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}

function Card({
  task,
  canManage,
  onEdit,
  onDelete,
}: {
  task: TaskRow;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [, start] = useTransition();
  const prio = PRIORITY[(task.priority as TaskPriorityReal) ?? "medium"] ??
    PRIORITY.medium;

  return (
    <div className="border-line bg-surface rounded-xl border p-3">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={canManage ? onEdit : undefined}
          className="min-w-0 text-left"
        >
          <div className="text-sm font-semibold">{task.title}</div>
          {task.clientName && (
            <div className="text-ink-muted truncate text-xs">
              {task.clientName}
            </div>
          )}
        </button>
        {canManage && (
          <div className="flex shrink-0 gap-0.5">
            <Button variant="ghost" size="icon-sm" onClick={onEdit}>
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onDelete}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StatusPill color={prio.color}>{prio.label}</StatusPill>
        {task.dueDate && (
          <span className="text-ink-muted text-[11px]">
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.subtasks.length > 0 && (
          <span className="text-ink-muted text-[11px]">
            ✓ {task.subtasks.filter((s) => s.done).length}/
            {task.subtasks.length}
          </span>
        )}
      </div>

      {(task.driveLink || task.figmaLink) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {task.driveLink && (
            <a
              href={task.driveLink}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="border-line hover:border-data/40 hover:text-ink text-ink-muted inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]"
            >
              <ExternalLink className="size-3" />
              Drive
            </a>
          )}
          {task.figmaLink && (
            <a
              href={task.figmaLink}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="border-line hover:border-data/40 hover:text-ink text-ink-muted inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]"
            >
              <ExternalLink className="size-3" />
              Figma
            </a>
          )}
        </div>
      )}

      {task.assigneeNames.length > 0 && (
        <div className="text-ink-muted mt-2 truncate text-[11px]">
          {task.assigneeNames.join(", ")}
        </div>
      )}

      {canManage && (
        <select
          value={task.status}
          onChange={(e) => {
            const status = e.target.value as TaskStatusReal;
            start(async () => {
              try {
                await moveTaskStatus(task.id, status);
              } catch (err) {
                toast.error(
                  actionError(err, "Falhou ao mover"),
                );
              }
            });
          }}
          className="border-line-strong text-ink-muted mt-2 h-7 w-full rounded-md border bg-transparent px-1.5 text-[11px] outline-none"
        >
          {COLUMNS.map((c) => (
            <option key={c.id} value={c.id}>
              Mover → {c.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function TasksBoard({
  tasks,
  people,
  clients,
  canManage,
  loadError,
}: {
  tasks: TaskRow[];
  people: { id: string; name: string }[];
  clients: { id: string; name: string }[];
  canManage: boolean;
  loadError: string | null;
}) {
  const [editing, setEditing] = useState<TaskInput | null>(null);
  const [deleting, setDeleting] = useState<TaskRow | null>(null);

  const byColumn = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    for (const c of COLUMNS) map.set(c.id, []);
    for (const t of tasks) (map.get(t.status) ?? map.get("pending"))!.push(t);
    return map;
  }, [tasks]);

  const toInput = (t: TaskRow): TaskInput => ({
    id: t.id,
    title: t.title,
    description: t.description ?? "",
    briefing: t.briefing ?? "",
    status: (TASK_STATUS as readonly string[]).includes(t.status)
      ? (t.status as TaskStatusReal)
      : "pending",
    priority: (TASK_PRIORITY as readonly string[]).includes(t.priority)
      ? (t.priority as TaskPriorityReal)
      : "medium",
    clientId: t.clientId,
    dueDate: t.dueDate,
    driveLink: t.driveLink ?? "",
    figmaLink: t.figmaLink ?? "",
    assignees: t.assignees,
    subtasks: t.subtasks.map((s) => ({
      id: s.id,
      title: s.title,
      done: s.done,
    })),
  });

  return (
    <>
      <div className="border-line flex items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
        <span className="text-ink-muted text-xs">
          {tasks.length} tarefas · tabela <code>tasks</code>
        </span>
        {canManage && (
          <Button size="sm" onClick={() => setEditing(BLANK)}>
            <Plus className="size-4" />
            Nova tarefa
          </Button>
        )}
      </div>

      {loadError ? (
        <div className="p-6">
          <div className="border-line bg-surface rounded-2xl border p-6 text-sm">
            <p className="font-medium">Não foi possível carregar as tarefas.</p>
            <p className="text-ink-muted mt-1">
              Rode a migration <code>0007</code> (bridge de RLS de{" "}
              <code>tasks</code> / <code>task_assignees</code>). Detalhe:{" "}
              {loadError}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto p-4 md:p-6">
          {COLUMNS.map((col) => {
            const items = byColumn.get(col.id) ?? [];
            return (
              <section
                key={col.id}
                className="flex w-[280px] shrink-0 flex-col"
              >
                <header className="mb-3 flex items-center gap-2 px-1">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: col.dot }}
                  />
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <span className="bg-surface-2 text-ink-muted rounded-full px-1.5 text-[11px] font-medium">
                    {items.length}
                  </span>
                </header>
                <div className="bg-surface-2/40 flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl p-2">
                  {items.map((task) => (
                    <Card
                      key={task.id}
                      task={task}
                      canManage={canManage}
                      onEdit={() => setEditing(toInput(task))}
                      onDelete={() => setDeleting(task)}
                    />
                  ))}
                  {items.length === 0 && (
                    <p className="text-ink-muted px-2 py-6 text-center text-xs">
                      Vazio
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-[460px]">
          {editing && (
            <TaskForm
              key={editing.id ?? "new"}
              initial={editing}
              people={people}
              clients={clients}
              onClose={() => setEditing(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {deleting && (
        <DeleteDialog task={deleting} onClose={() => setDeleting(null)} />
      )}
    </>
  );
}
