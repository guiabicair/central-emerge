"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Check, Play, Send, Square, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  addComment,
  deleteComment,
  deleteDelivery,
  deleteTimeEntry,
  reviewDelivery,
  startTimer,
  stopTimer,
  submitDelivery,
} from "@/app/(app)/tarefas/detail-actions";
import { STATUS_META } from "@/app/(app)/calendario-social/social-constants";
import type { TaskRow } from "@/components/tarefas/tasks-board";
import { Button } from "@/components/ui/button";
import { actionError, formatDate } from "@/lib/utils";

function fmtDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m}min`;
}

const DELIVERY_META: Record<string, { label: string; cls: string }> = {
  submitted: { label: "Aguardando revisão", cls: "text-wip" },
  approved: { label: "Aprovada", cls: "text-done" },
  changes_requested: { label: "Ajustes pedidos", cls: "text-warn" },
};

export function TaskDetailSections({ task }: { task: TaskRow }) {
  return (
    <div className="border-line space-y-4 border-t pt-4">
      <TimerSection task={task} />
      <DeliveriesSection task={task} />
      {task.linkedSocialPosts.length > 0 && (
        <LinkedSocialPostsSection posts={task.linkedSocialPosts} />
      )}
      <CommentsSection task={task} />
    </div>
  );
}

/* ------------------- Posts do Calendário Social ------------------- */

function LinkedSocialPostsSection({
  posts,
}: {
  posts: TaskRow["linkedSocialPosts"];
}) {
  return (
    <div>
      <span className="text-ink-muted text-[11px] font-semibold uppercase">
        Calendário Social ({posts.length})
      </span>
      <div className="mt-1 space-y-1.5">
        {posts.map((p) => {
          const meta = STATUS_META[p.status] ?? {
            label: p.status,
            color: "var(--ink-muted)",
          };
          return (
            <Link
              key={p.id}
              href={`/calendario-social?p=${p.projectId}&open=${p.id}`}
              className="border-line hover:border-line-strong flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm"
            >
              <span className="truncate">{p.title}</span>
              <span
                className="shrink-0 text-[11px] font-semibold"
                style={{ color: meta.color }}
              >
                {meta.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------- Cronômetro --------------------------- */

function TimerSection({ task }: { task: TaskRow }) {
  const [pending, start] = useTransition();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!task.activeTimer) return;
    const t0 = new Date(task.activeTimer.startTime).getTime();
    const tick = () => setElapsed(Math.max(0, (Date.now() - t0) / 1000));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [task.activeTimer]);

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      try {
        await fn();
      } catch (e) {
        toast.error(actionError(e, "Falhou o cronômetro"));
      }
    });

  return (
    <div>
      <span className="text-ink-muted text-[11px] font-semibold uppercase">
        Cronômetro
      </span>
      <div className="border-line mt-1 flex items-center justify-between rounded-md border p-2.5 text-sm">
        <div>
          <div className="font-medium">
            {task.activeTimer
              ? fmtDuration(elapsed) + " rodando"
              : "Parado"}
          </div>
          <div className="text-ink-muted text-[11px]">
            {fmtDuration(task.loggedSeconds)} registrados no total
          </div>
        </div>
        {task.activeTimer ? (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run(() => stopTimer(task.activeTimer!.id))}
          >
            <Square className="size-3.5" />
            Parar
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => run(() => startTimer(task.id))}
          >
            <Play className="size-3.5" />
            Iniciar
          </Button>
        )}
      </div>

      {task.timeIntervals.length > 0 && (
        <div className="mt-1.5 space-y-1">
          {task.timeIntervals.map((iv) => (
            <div
              key={iv.id}
              className="text-ink-muted flex items-center justify-between text-[11px]"
            >
              <span>
                {formatDate(iv.start)} · {fmtDuration(iv.seconds)}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => deleteTimeEntry(iv.id))}
                className="hover:text-gap"
                aria-label="Apagar intervalo"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------- Entregas ---------------------------- */

function DeliveriesSection({ task }: { task: TaskRow }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [fb, setFb] = useState("");

  const run = (fn: () => Promise<unknown>, after?: () => void) =>
    start(async () => {
      try {
        await fn();
        after?.();
      } catch (e) {
        toast.error(actionError(e, "Falhou a entrega"));
      }
    });

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-ink-muted text-[11px] font-semibold uppercase">
          Entregas ({task.deliveries.length})
        </span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Fechar" : "Submeter entrega"}
        </Button>
      </div>

      {open && (
        <div className="border-line mt-1 space-y-2 rounded-md border p-2.5">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Link da pasta no Drive"
            className="border-line-strong focus:border-data h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none"
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            placeholder="O que foi entregue"
            className="border-line-strong focus:border-data w-full rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none"
          />
          <div className="flex justify-end">
            <Button
              size="xs"
              disabled={pending || (!url.trim() && !desc.trim())}
              onClick={() =>
                run(
                  () => submitDelivery(task.id, url, desc),
                  () => {
                    setUrl("");
                    setDesc("");
                    setOpen(false);
                    toast.success("Entrega submetida");
                  },
                )
              }
            >
              <Send className="size-3.5" />
              Submeter
            </Button>
          </div>
        </div>
      )}

      <div className="mt-2 space-y-2">
        {task.deliveries.length === 0 && (
          <p className="text-ink-muted text-xs">Nenhuma entrega ainda.</p>
        )}
        {task.deliveries.map((d) => {
          const meta = DELIVERY_META[d.status] ?? {
            label: d.status,
            cls: "text-ink-muted",
          };
          return (
            <div key={d.id} className="border-line rounded-md border p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-semibold ${meta.cls}`}>
                  {meta.label}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  onClick={() => run(() => deleteDelivery(d.id))}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              {d.description && (
                <div className="mt-1 text-sm">{d.description}</div>
              )}
              <div className="text-ink-muted mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                {d.driveUrl && (
                  <a
                    href={d.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-data-text hover:underline"
                  >
                    abrir Drive
                  </a>
                )}
                <span>
                  {d.submittedBy} · {formatDate(d.submittedAt)}
                </span>
              </div>
              {d.feedback && (
                <div className="border-line text-ink-muted mt-1.5 border-l-2 pl-2 text-xs">
                  {d.feedback}
                  {d.reviewedBy && (
                    <span className="ml-1">— {d.reviewedBy}</span>
                  )}
                </div>
              )}

              {d.status === "submitted" && (
                <div className="mt-2">
                  {reviewing === d.id ? (
                    <div className="space-y-1.5">
                      <textarea
                        value={fb}
                        onChange={(e) => setFb(e.target.value)}
                        rows={2}
                        placeholder="Feedback (opcional pra aprovar, recomendado pra pedir ajuste)"
                        className="border-line-strong focus:border-data w-full rounded-md border bg-transparent px-2 py-1.5 text-xs outline-none"
                      />
                      <div className="flex gap-1.5">
                        <Button
                          size="xs"
                          disabled={pending}
                          onClick={() =>
                            run(
                              () => reviewDelivery(d.id, true, fb),
                              () => {
                                setReviewing(null);
                                setFb("");
                                toast.success("Entrega aprovada");
                              },
                            )
                          }
                        >
                          <Check className="size-3.5" />
                          Aprovar
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={pending}
                          onClick={() =>
                            run(
                              () => reviewDelivery(d.id, false, fb),
                              () => {
                                setReviewing(null);
                                setFb("");
                                toast.message("Ajustes pedidos");
                              },
                            )
                          }
                        >
                          <X className="size-3.5" />
                          Pedir ajuste
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setReviewing(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setReviewing(d.id);
                        setFb("");
                      }}
                    >
                      Revisar
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------- Comentários ------------------------- */

function CommentsSection({ task }: { task: TaskRow }) {
  const [pending, start] = useTransition();
  const [text, setText] = useState("");

  const run = (fn: () => Promise<unknown>, after?: () => void) =>
    start(async () => {
      try {
        await fn();
        after?.();
      } catch (e) {
        toast.error(actionError(e, "Falhou o comentário"));
      }
    });

  return (
    <div>
      <span className="text-ink-muted text-[11px] font-semibold uppercase">
        Comentários ({task.comments.length})
      </span>
      <div className="mt-1 space-y-2">
        {task.comments.map((c) => (
          <div key={c.id} className="border-line rounded-md border p-2.5">
            <div className="text-ink-muted flex items-center justify-between text-[11px]">
              <span>
                {c.author} · {formatDate(c.at)}
              </span>
              {c.isMine && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  onClick={() => run(() => deleteComment(c.id))}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
            <div className="mt-0.5 text-sm whitespace-pre-wrap">{c.content}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Escrever um comentário…"
          className="border-line-strong focus:border-data flex-1 rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none"
        />
        <Button
          size="sm"
          disabled={pending || !text.trim()}
          onClick={() =>
            run(
              () => addComment(task.id, text),
              () => setText(""),
            )
          }
        >
          <Send className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
