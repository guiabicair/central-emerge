"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckSquare,
  Columns3,
  ExternalLink,
  KanbanSquare,
  List,
  Pencil,
  Plus,
  Rows3,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  bulkArchive,
  bulkDelete,
  bulkMoveStatus,
  createStatus,
  deleteStatus,
  deleteTask,
  moveStatus,
  moveTaskStatus,
  renameStatus,
  saveTask,
  setArchived,
  setStatusColor,
} from "@/app/(app)/tarefas/actions";
import {
  STATUS_COLORS,
  TASK_PRIORITY,
  colDot,
  colLabel,
  type StatusCol,
  type SubtaskInput,
  type TaskInput,
  type TaskPriorityReal,
} from "@/app/(app)/tarefas/task-constants";
import { TasksCalendar } from "@/components/tarefas/tasks-calendar";
import { TasksList } from "@/components/tarefas/tasks-list";
import { TasksTimeline } from "@/components/tarefas/tasks-timeline";
import { StatusPill, type PillColor } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { brtParts } from "@/lib/calendar";
import { actionError, cn, formatDate } from "@/lib/utils";

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
  archived: boolean;
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

type BoardView = "kanban" | "lista" | "calendario" | "cronograma";

const VIEW_TABS: { id: BoardView; label: string; icon: typeof List }[] = [
  { id: "kanban", label: "Kanban", icon: KanbanSquare },
  { id: "lista", label: "Lista", icon: List },
  { id: "calendario", label: "Calendário", icon: CalendarDays },
  { id: "cronograma", label: "Cronograma", icon: Rows3 },
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
  statuses,
  people,
  clients,
  onClose,
}: {
  initial: TaskInput;
  statuses: StatusCol[];
  people: { id: string; name: string }[];
  clients: { id: string; name: string }[];
  onClose: () => void;
}) {
  const pristine = JSON.stringify(initial);
  const [form, setForm] = useState<TaskInput>(() => loadDraft(initial));
  // só considera "tem rascunho" se o que está salvo difere do estado inicial —
  // um draft todo-vazio (aberto e fechado sem digitar) não vale aviso
  const [hadDraft, setHadDraft] = useState(
    () => JSON.stringify(loadDraft(initial)) !== pristine,
  );
  const [pending, start] = useTransition();
  const set = <K extends keyof TaskInput>(k: K, v: TaskInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // rascunho: guarda o que foi digitado; se o form voltou ao estado inicial
  // (Descartar, ou nada digitado) apaga a chave em vez de gravar lixo
  useEffect(() => {
    if (JSON.stringify(form) === pristine) clearDraft(initial.id);
    else saveDraft(form);
  }, [form, pristine, initial.id]);

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
              onChange={(e) => set("status", e.target.value)}
              className={`mt-1 ${inputCls}`}
            >
              {statuses.map((c) => (
                <option key={c.id} value={c.name}>
                  {colLabel(c.name)}
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
  statuses,
  canManage,
  selecting,
  checked,
  onCheck,
  onEdit,
  onDelete,
}: {
  task: TaskRow;
  statuses: StatusCol[];
  canManage: boolean;
  selecting: boolean;
  checked: boolean;
  onCheck: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [, start] = useTransition();
  const prio = PRIORITY[(task.priority as TaskPriorityReal) ?? "medium"] ??
    PRIORITY.medium;

  return (
    <div
      className={cn(
        "border-line bg-surface rounded-xl border p-3",
        selecting && checked && "border-data ring-data/30 ring-1",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {selecting && (
            <input
              type="checkbox"
              checked={checked}
              onChange={onCheck}
              className="accent-[var(--data)] mt-0.5"
              aria-label="Selecionar tarefa"
            />
          )}
          <button
            type="button"
            onClick={selecting ? onCheck : canManage ? onEdit : undefined}
            className="min-w-0 text-left"
          >
            <div className="text-sm font-semibold">{task.title}</div>
            {task.clientName && (
              <div className="text-ink-muted truncate text-xs">
                {task.clientName}
              </div>
            )}
          </button>
        </div>
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
        {task.archived && (
          <button
            type="button"
            onClick={() =>
              start(async () => {
                try {
                  await setArchived(task.id, false);
                  toast.success("Desarquivada");
                } catch (err) {
                  toast.error(actionError(err, "Falhou ao desarquivar"));
                }
              })
            }
            className="border-line text-ink-muted hover:text-ink rounded-full border px-1.5 py-0.5 text-[10px]"
          >
            arquivada · desarquivar
          </button>
        )}
        {task.dueDate && (
          <span className="text-ink-muted text-[11px]">
            {formatDate(task.dueDate)}
          </span>
        )}
        {(task.subtasks?.length ?? 0) > 0 && (
          <span className="text-ink-muted text-[11px]">
            ✓ {(task.subtasks ?? []).filter((s) => s.done).length}/
            {task.subtasks!.length}
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
            const status = e.target.value;
            start(async () => {
              try {
                await moveTaskStatus(task.id, status);
              } catch (err) {
                toast.error(actionError(err, "Falhou ao mover"));
              }
            });
          }}
          className="border-line-strong text-ink-muted mt-2 h-7 w-full rounded-md border bg-transparent px-1.5 text-[11px] outline-none"
        >
          {statuses.map((c) => (
            <option key={c.id} value={c.name}>
              Mover → {colLabel(c.name)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function ColumnManager({
  cols,
  onClose,
}: {
  cols: StatusCol[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>(
    () => Object.fromEntries(cols.map((c) => [c.id, c.name])),
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dest, setDest] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>("slate");

  const run = (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    start(async () => {
      try {
        await fn();
        router.refresh(); // o painel fica aberto — puxa o board novo na hora
      } catch (e) {
        toast.error(actionError(e, "Falhou"));
      } finally {
        setBusy(null);
      }
    });
  };

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-line border-b p-5 pr-12">
        <SheetTitle className="text-base font-semibold">
          Colunas do Kanban
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 space-y-2 overflow-y-auto p-5">
        {cols.map((c, i) => (
          <div key={c.id} className="border-line rounded-lg border p-2.5">
            <div className="flex items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: colDot(c.color) }}
              />
              <input
                value={names[c.id] ?? c.name}
                onChange={(e) =>
                  setNames((n) => ({ ...n, [c.id]: e.target.value }))
                }
                onBlur={() => {
                  const v = (names[c.id] ?? "").trim();
                  if (v && v !== c.name) run(`name:${c.id}`, () => renameStatus(c.id, v));
                }}
                className="border-line-strong focus:border-data h-8 flex-1 rounded-md border bg-transparent px-2 text-sm outline-none"
              />
              <select
                value={c.color}
                onChange={(e) =>
                  run(`color:${c.id}`, () => setStatusColor(c.id, e.target.value))
                }
                className="border-line-strong h-8 rounded-md border bg-transparent px-1 text-xs outline-none"
              >
                {STATUS_COLORS.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={i === 0 || busy !== null}
                onClick={() => run(`up:${c.id}`, () => moveStatus(c.id, "up"))}
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={i === cols.length - 1 || busy !== null}
                onClick={() => run(`down:${c.id}`, () => moveStatus(c.id, "down"))}
              >
                <ArrowDown className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={cols.length <= 1}
                onClick={() => {
                  setDeletingId(deletingId === c.id ? null : c.id);
                  setDest(cols.find((x) => x.id !== c.id)?.name ?? "");
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            {deletingId === c.id && (
              <div className="border-line mt-2 flex items-center gap-2 border-t pt-2 text-[11px]">
                <span className="text-ink-muted">Mover tarefas para</span>
                <select
                  value={dest}
                  onChange={(e) => setDest(e.target.value)}
                  className="border-line-strong h-7 flex-1 rounded-md border bg-transparent px-1.5 outline-none"
                >
                  {cols
                    .filter((x) => x.id !== c.id)
                    .map((x) => (
                      <option key={x.id} value={x.name}>
                        {colLabel(x.name)}
                      </option>
                    ))}
                </select>
                <Button
                  variant="destructive"
                  size="xs"
                  disabled={busy !== null || !dest}
                  onClick={() =>
                    run(`del:${c.id}`, async () => {
                      await deleteStatus(c.id, dest);
                      setDeletingId(null);
                    })
                  }
                >
                  Excluir
                </Button>
              </div>
            )}
          </div>
        ))}

        <div className="border-line mt-3 rounded-lg border border-dashed p-2.5">
          <span className="text-ink-muted text-[11px] font-semibold uppercase">
            Nova coluna
          </span>
          <div className="mt-1.5 flex items-center gap-1.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Bloqueado"
              className="border-line-strong focus:border-data h-8 flex-1 rounded-md border bg-transparent px-2 text-sm outline-none"
            />
            <select
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="border-line-strong h-8 rounded-md border bg-transparent px-1 text-xs outline-none"
            >
              {STATUS_COLORS.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={busy !== null || !newName.trim()}
              onClick={() =>
                run("create", async () => {
                  await createStatus(newName, newColor);
                  setNewName("");
                })
              }
            >
              Criar
            </Button>
          </div>
        </div>
      </div>

      <div className="border-line flex justify-end border-t p-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}

const DONE_NAMES = new Set(["completed", "cancelled"]);
const PRIO_LABEL: Record<string, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};
const QUICK_LABEL: Record<string, string> = {
  minhas: "Minhas",
  hoje: "Hoje",
  atrasadas: "Atrasadas",
};

interface Filters {
  priority: string | null;
  status: string | null;
  clientId: string | null;
  period: "all" | "week" | "month" | "none";
}
const NO_FILTERS: Filters = {
  priority: null,
  status: null,
  clientId: null,
  period: "all",
};
type Quick = "minhas" | "hoje" | "atrasadas";

export function TasksBoard({
  tasks,
  statuses,
  people,
  clients,
  clientFilterOptions,
  currentUserId,
  canManage,
  loadError,
}: {
  tasks: TaskRow[];
  statuses: StatusCol[];
  people: { id: string; name: string }[];
  clients: { id: string; name: string }[];
  clientFilterOptions: { id: string; name: string }[];
  currentUserId: string | null;
  canManage: boolean;
  loadError: string | null;
}) {
  const [editing, setEditing] = useState<TaskInput | null>(null);
  const [deleting, setDeleting] = useState<TaskRow | null>(null);
  const [manageCols, setManageCols] = useState(false);
  const [view, setView] = useState<BoardView>("kanban");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [quick, setQuick] = useState<Set<Quick>>(() => new Set());
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [bulk, setBulk] = useState<
    "concluir" | "excluir" | "arquivar" | "concluir-arquivar" | null
  >(null);
  const [bulkPending, startBulk] = useTransition();
  const [showArchived, setShowArchived] = useState(false);

  const cols = useMemo(
    () => [...statuses].sort((a, b) => a.position - b.position),
    [statuses],
  );
  const fallbackCol = cols[0]?.name ?? "pending";
  const colName = (want: string) =>
    cols.find((c) => c.name === want)?.name ?? null;

  const todayIso = useMemo(
    () => brtParts(new Date().toISOString()).day,
    [],
  );

  const filtersActive =
    !!filters.priority ||
    !!filters.status ||
    !!filters.clientId ||
    filters.period !== "all" ||
    quick.size > 0;

  // tarefas visíveis por padrão: as não-arquivadas (ou tudo com o toggle)
  const visibleTasks = useMemo(
    () => (showArchived ? tasks : tasks.filter((t) => !t.archived)),
    [tasks, showArchived],
  );
  const archivedCount = useMemo(
    () => tasks.filter((t) => t.archived).length,
    [tasks],
  );

  const quickCount = useMemo(() => {
    const base = tasks.filter((t) => !t.archived);
    const isOverdue = (t: TaskRow) =>
      !!t.dueDate &&
      brtParts(t.dueDate).day < todayIso &&
      !DONE_NAMES.has(t.status);
    return {
      minhas: currentUserId
        ? base.filter((t) => t.assignees.includes(currentUserId)).length
        : 0,
      hoje: base.filter(
        (t) => t.dueDate && brtParts(t.dueDate).day === todayIso,
      ).length,
      atrasadas: base.filter(isOverdue).length,
    };
  }, [tasks, currentUserId, todayIso]);

  const filteredTasks = useMemo(() => {
    const monthPrefix = todayIso.slice(0, 7);
    const weekEnd = (() => {
      const [y, m, d] = todayIso.split("-").map(Number);
      const dt = new Date(y, m - 1, d + 7);
      return brtParts(dt.toISOString()).day;
    })();
    return visibleTasks.filter((t) => {
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.clientId && t.clientId !== filters.clientId) return false;
      if (filters.period === "none" && t.dueDate) return false;
      if (filters.period === "week") {
        if (!t.dueDate) return false;
        const day = brtParts(t.dueDate).day;
        if (day < todayIso || day > weekEnd) return false;
      }
      if (filters.period === "month") {
        if (!t.dueDate || !brtParts(t.dueDate).day.startsWith(monthPrefix))
          return false;
      }
      if (
        quick.has("minhas") &&
        (!currentUserId || !t.assignees.includes(currentUserId))
      )
        return false;
      if (
        quick.has("hoje") &&
        (!t.dueDate || brtParts(t.dueDate).day !== todayIso)
      )
        return false;
      if (
        quick.has("atrasadas") &&
        (!t.dueDate ||
          brtParts(t.dueDate).day >= todayIso ||
          DONE_NAMES.has(t.status))
      )
        return false;
      return true;
    });
  }, [visibleTasks, filters, quick, currentUserId, todayIso]);

  const clearFilters = () => {
    setFilters(NO_FILTERS);
    setQuick(new Set());
  };

  const clearSelection = () => {
    setSelecting(false);
    setSelected(new Set());
  };
  const toggleSelected = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const completedName = colName("completed") ?? cols.at(-1)?.name ?? fallbackCol;

  const runBulk = (fn: () => Promise<unknown>, msg: string) =>
    startBulk(async () => {
      try {
        await fn();
        toast.success(msg);
        clearSelection();
        setBulk(null);
      } catch (e) {
        toast.error(actionError(e, "Falhou a ação em lote"));
      }
    });
  const toggleQuick = (q: Quick) =>
    setQuick((s) => {
      const n = new Set(s);
      if (n.has(q)) n.delete(q);
      else n.add(q);
      toast.message(
        n.has(q) ? `Filtro: ${QUICK_LABEL[q]}` : "Filtro removido",
      );
      return n;
    });

  // atalhos de teclado (ignora quando digitando)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable)
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "escape") {
        if (selected.size || selecting) {
          clearSelection();
          return;
        }
        if (filtersActive) {
          clearFilters();
          toast.message("Filtros removidos");
        }
        return;
      }
      if (k === "r") {
        if (filtersActive) {
          clearFilters();
          toast.message("Filtros removidos");
        }
        return;
      }
      if (k === "p") {
        const n = colName("pending") ?? fallbackCol;
        setFilters((f) => ({ ...f, status: n }));
        toast.message("Filtro: Pendentes");
      } else if (k === "c") {
        const n = colName("completed");
        if (n) {
          setFilters((f) => ({ ...f, status: n }));
          toast.message("Filtro: Concluídas");
        }
      } else if (["1", "2", "3", "4"].includes(k)) {
        const map: Record<string, string> = {
          "1": "urgent",
          "2": "high",
          "3": "medium",
          "4": "low",
        };
        setFilters((f) => ({ ...f, priority: map[k] }));
        toast.message(`Filtro: prioridade ${PRIO_LABEL[map[k]]}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersActive, cols, fallbackCol, selecting, selected]);

  const byColumn = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    for (const c of cols) map.set(c.name, []);
    for (const t of filteredTasks)
      (map.get(t.status) ?? map.get(fallbackCol))?.push(t);
    return map;
  }, [filteredTasks, cols, fallbackCol]);

  const toInput = (t: TaskRow): TaskInput => ({
    id: t.id,
    title: t.title,
    description: t.description ?? "",
    briefing: t.briefing ?? "",
    status: cols.some((c) => c.name === t.status) ? t.status : fallbackCol,
    priority: (TASK_PRIORITY as readonly string[]).includes(t.priority)
      ? (t.priority as TaskPriorityReal)
      : "medium",
    clientId: t.clientId,
    dueDate: t.dueDate,
    driveLink: t.driveLink ?? "",
    figmaLink: t.figmaLink ?? "",
    assignees: t.assignees,
    subtasks: (t.subtasks ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      done: s.done,
    })),
  });

  const openTask = (t: TaskRow) => setEditing(toInput(t));

  return (
    <>
      <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="border-line bg-surface-2/40 flex items-center gap-0.5 rounded-lg border p-0.5">
            {VIEW_TABS.map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    view === v.id
                      ? "bg-surface text-ink shadow-sm"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              );
            })}
          </div>
          <span className="text-ink-muted text-xs">
            {filtersActive
              ? `${filteredTasks.length} de ${tasks.length}`
              : `${tasks.length} tarefas · ${cols.length} colunas`}
          </span>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            {view === "kanban" && (
              <Button
                variant={selecting ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  selecting ? clearSelection() : setSelecting(true)
                }
              >
                <CheckSquare className="size-4" />
                {selecting ? "Sair da seleção" : "Selecionar"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManageCols(true)}
            >
              <Columns3 className="size-4" />
              Colunas
            </Button>
            <Button
              size="sm"
              onClick={() => setEditing({ ...BLANK, status: fallbackCol })}
            >
              <Plus className="size-4" />
              Nova tarefa
            </Button>
          </div>
        )}
      </div>

      {selecting && (
        <div className="border-line bg-data/8 flex flex-wrap items-center gap-2 border-b px-4 py-2 text-xs md:px-6">
          <span className="font-medium">
            {selected.size} selecionada{selected.size === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            className="text-ink-muted hover:text-ink"
            onClick={() => {
              const ids = filteredTasks.map((t) => t.id);
              setSelected(
                selected.size === ids.length ? new Set() : new Set(ids),
              );
            }}
          >
            {selected.size === filteredTasks.length && filteredTasks.length
              ? "limpar"
              : "selecionar todas"}
          </button>
          <span className="bg-line mx-1 h-4 w-px" />
          <Button
            size="xs"
            disabled={selected.size === 0 || bulkPending}
            onClick={() => setBulk("concluir")}
          >
            Concluir
          </Button>
          <Button
            size="xs"
            variant="outline"
            disabled={selected.size === 0 || bulkPending}
            onClick={() => setBulk("arquivar")}
          >
            Arquivar
          </Button>
          <Button
            size="xs"
            variant="outline"
            disabled={selected.size === 0 || bulkPending}
            onClick={() => setBulk("concluir-arquivar")}
          >
            Concluir + arquivar
          </Button>
          <Button
            size="xs"
            variant="destructive"
            disabled={selected.size === 0 || bulkPending}
            onClick={() => setBulk("excluir")}
          >
            Excluir
          </Button>
          <button
            type="button"
            className="text-data-text hover:underline"
            onClick={clearSelection}
          >
            Sair
          </button>
        </div>
      )}

      {!loadError && (
        <div className="border-line flex flex-wrap items-center gap-2 border-b px-4 py-2 text-xs md:px-6">
          {(["minhas", "hoje", "atrasadas"] as Quick[]).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => toggleQuick(q)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition-colors",
                quick.has(q)
                  ? "border-data/40 bg-data/12 text-data-text"
                  : "border-line text-ink-muted hover:text-ink",
              )}
            >
              {QUICK_LABEL[q]}
              <span
                className={cn(
                  "rounded-full px-1 text-[10px]",
                  quick.has(q) ? "bg-data/20" : "bg-surface-2",
                )}
              >
                {quickCount[q]}
              </span>
            </button>
          ))}

          <span className="bg-line mx-1 h-4 w-px" />

          <select
            value={filters.priority ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                priority: e.target.value || null,
              }))
            }
            className="border-line-strong h-7 rounded-md border bg-transparent px-1.5 outline-none"
          >
            <option value="">Prioridade</option>
            {TASK_PRIORITY.map((p) => (
              <option key={p} value={p}>
                {PRIO_LABEL[p]}
              </option>
            ))}
          </select>

          <select
            value={filters.status ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value || null }))
            }
            className="border-line-strong h-7 rounded-md border bg-transparent px-1.5 outline-none"
          >
            <option value="">Coluna</option>
            {cols.map((c) => (
              <option key={c.id} value={c.name}>
                {colLabel(c.name)}
              </option>
            ))}
          </select>

          <select
            value={filters.clientId ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, clientId: e.target.value || null }))
            }
            className="border-line-strong h-7 rounded-md border bg-transparent px-1.5 outline-none"
          >
            <option value="">Cliente</option>
            {clientFilterOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filters.period}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                period: e.target.value as Filters["period"],
              }))
            }
            className="border-line-strong h-7 rounded-md border bg-transparent px-1.5 outline-none"
          >
            <option value="all">Período: todos</option>
            <option value="week">Vence em 7 dias</option>
            <option value="month">Este mês</option>
            <option value="none">Sem prazo</option>
          </select>

          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                clearFilters();
                toast.message("Filtros removidos");
              }}
              className="text-data-text hover:underline"
            >
              Limpar
            </button>
          )}

          {archivedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
                showArchived
                  ? "border-data/40 bg-data/12 text-data-text"
                  : "border-line text-ink-muted hover:text-ink",
              )}
            >
              {showArchived ? "Ocultar arquivadas" : "Ver arquivadas"} (
              {archivedCount})
            </button>
          )}

          <span className="text-ink-muted ml-auto hidden lg:inline">
            atalhos: P pendentes · C concluídas · 1–4 prioridade · R/Esc
            limpa
          </span>
        </div>
      )}

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
      ) : view === "lista" ? (
        <TasksList tasks={filteredTasks} statuses={cols} onOpenTask={openTask} />
      ) : view === "calendario" ? (
        <TasksCalendar tasks={filteredTasks} statuses={cols} onOpenTask={openTask} />
      ) : view === "cronograma" ? (
        <TasksTimeline tasks={filteredTasks} statuses={cols} onOpenTask={openTask} />
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto p-4 md:p-6">
          {cols.map((col) => {
            const items = byColumn.get(col.name) ?? [];
            return (
              <section
                key={col.id}
                className="flex w-[280px] shrink-0 flex-col"
              >
                <header className="mb-3 flex items-center gap-2 px-1">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: colDot(col.color) }}
                  />
                  <h3 className="text-sm font-semibold">{colLabel(col.name)}</h3>
                  <span className="bg-surface-2 text-ink-muted rounded-full px-1.5 text-[11px] font-medium">
                    {items.length}
                  </span>
                </header>
                <div className="bg-surface-2/40 flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl p-2">
                  {items.map((task) => (
                    <Card
                      key={task.id}
                      task={task}
                      statuses={cols}
                      canManage={canManage}
                      selecting={selecting}
                      checked={selected.has(task.id)}
                      onCheck={() => toggleSelected(task.id)}
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
              statuses={cols}
              people={people}
              clients={clients}
              onClose={() => setEditing(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={manageCols} onOpenChange={setManageCols}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-[420px]">
          <ColumnManager cols={cols} onClose={() => setManageCols(false)} />
        </SheetContent>
      </Sheet>

      {deleting && (
        <DeleteDialog task={deleting} onClose={() => setDeleting(null)} />
      )}

      {bulk &&
        (() => {
          const n = selected.size;
          const plural = n === 1 ? "" : "s";
          const meta = {
            concluir: {
              title: `Concluir ${n} tarefa${plural}?`,
              body: `Move as selecionadas para "${colLabel(completedName)}".`,
              cta: "Concluir",
              danger: false,
            },
            arquivar: {
              title: `Arquivar ${n} tarefa${plural}?`,
              body: "Somem do board e das views; dá pra ver de novo com 'Ver arquivadas'.",
              cta: "Arquivar",
              danger: false,
            },
            "concluir-arquivar": {
              title: `Concluir e arquivar ${n} tarefa${plural}?`,
              body: `Move para "${colLabel(completedName)}" e arquiva.`,
              cta: "Concluir + arquivar",
              danger: false,
            },
            excluir: {
              title: `Excluir ${n} tarefa${plural}?`,
              body: "Não dá pra desfazer.",
              cta: "Excluir",
              danger: true,
            },
          }[bulk];
          return (
            <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
              <div className="border-line bg-surface w-full max-w-sm rounded-xl border p-5">
                <h3 className="text-sm font-semibold">{meta.title}</h3>
                <p className="text-ink-muted mt-1 text-sm">{meta.body}</p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBulk(null)}
                    disabled={bulkPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant={meta.danger ? "destructive" : "default"}
                    disabled={bulkPending}
                    onClick={() => {
                      const ids = [...selected];
                      const done = `${ids.length} tarefa${ids.length === 1 ? "" : "s"} · ${meta.cta.toLowerCase()}`;
                      if (bulk === "concluir")
                        runBulk(
                          () => bulkMoveStatus(ids, completedName),
                          done,
                        );
                      else if (bulk === "arquivar")
                        runBulk(() => bulkArchive(ids, false), done);
                      else if (bulk === "concluir-arquivar")
                        runBulk(() => bulkArchive(ids, true), done);
                      else runBulk(() => bulkDelete(ids), done);
                    }}
                  >
                    {bulkPending ? "…" : meta.cta}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
}
