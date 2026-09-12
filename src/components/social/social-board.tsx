"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DragEvent } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Flag,
  Link2,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  addMarker,
  createProject,
  deleteMarker,
  deleteProject,
  movePostDate,
  regenShareToken,
  setPostStatus,
  setShareExpiry,
} from "@/app/(app)/calendario-social/actions";
import {
  PROJECT_COLORS,
  SOCIAL_STATUS,
  STATUS_META,
} from "@/app/(app)/calendario-social/social-constants";
import { PostDialog } from "@/components/social/social-post-dialog";
import type {
  SocialMarker,
  SocialPost,
  SocialProject,
} from "@/lib/social/queries";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addMonths,
  monthLabel,
  monthMatrix,
  startOfMonth,
  WEEKDAY_LABELS,
  ymd,
} from "@/lib/calendar";
import { actionError } from "@/lib/utils";

const SHARE_BASE =
  typeof window !== "undefined" ? window.location.origin : "";

function parseMonth(m: string | null): Date {
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split("-").map(Number);
    return new Date(y, mo - 1, 1);
  }
  return startOfMonth(new Date());
}

export function SocialBoard({
  projects,
  activeId,
  posts,
  markers,
  tasks,
  canManage,
  month,
}: {
  projects: SocialProject[];
  activeId: string | null;
  posts: SocialPost[];
  markers: SocialMarker[];
  tasks: { id: string; title: string }[];
  canManage: boolean;
  month: string | null;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [view, setView] = useState<"mes" | "kanban">("mes");
  const [monthStart, setMonthStart] = useState<Date>(parseMonth(month));
  const [dialog, setDialog] = useState<
    | { kind: "post"; date: string; postId: string | null }
    | { kind: "project" }
    | { kind: "marker"; date: string }
    | { kind: "share" }
    | null
  >(null);
  // id de projeto pra qual o usuário navegou mas o server ainda não re-renderizou.
  // enquanto isso o `activeId`/`project` prop estão defasados → trava as ações
  // (senão "Compartilhar" entregava o token do projeto anterior — vazamento).
  const [pendingId, setPendingId] = useState<string | null>(null);
  const navigating = pendingId !== null && pendingId !== activeId;

  const project = projects.find((p) => p.id === activeId) ?? null;

  const selectProject = (id: string) => {
    if (id === activeId) return;
    setDialog(null);
    setPendingId(id);
    router.push(`/calendario-social?p=${id}`);
  };

  // projeto renderizado mudou de fato: fecha qualquer dialog aberto (não pode
  // sobrar dialog do projeto antigo) e destrava as ações.
  useEffect(() => {
    setDialog(null);
    setPendingId(null);
  }, [activeId]);

  // abertura direta vinda de Tarefas (painel de detalhe → link do post) —
  // /calendario-social?p=<projeto>&open=<post_id> já popa o dialog do post.
  const openedFromQueryRef = useRef(false);
  useEffect(() => {
    if (openedFromQueryRef.current) return;
    const openId = new URLSearchParams(window.location.search).get("open");
    if (!openId) return;
    const p = posts.find((pp) => pp.id === openId);
    if (!p) return;
    openedFromQueryRef.current = true;
    setDialog({ kind: "post", date: p.date, postId: p.id });
    const params = new URLSearchParams(window.location.search);
    params.delete("open");
    const qs = params.toString();
    router.replace(`/calendario-social${qs ? `?${qs}` : ""}`, {
      scroll: false,
    });
  }, [posts, router]);

  // post do dialog sempre re-derivado da lista viva (mostra arte recém-enviada
  // sem precisar fechar/reabrir).
  const openPost =
    dialog?.kind === "post" && dialog.postId
      ? (posts.find((p) => p.id === dialog.postId) ?? null)
      : null;

  const weeks = useMemo(() => monthMatrix(monthStart), [monthStart]);
  const postsByDay = useMemo(() => {
    const m = new Map<string, SocialPost[]>();
    for (const p of posts) {
      const arr = m.get(p.date) ?? [];
      arr.push(p);
      m.set(p.date, arr);
    }
    return m;
  }, [posts]);
  const markersByDay = useMemo(() => {
    const m = new Map<string, SocialMarker[]>();
    for (const k of markers) {
      const arr = m.get(k.date) ?? [];
      arr.push(k);
      m.set(k.date, arr);
    }
    return m;
  }, [markers]);

  const shiftMonth = (n: number) => setMonthStart((d) => addMonths(d, n));

  /* ---------------- empty / no project ---------------- */
  if (!project) {
    return (
      <div className="flex flex-1 gap-5 p-5">
        <ProjectRail
          projects={projects}
          activeId={activeId}
          canManage={canManage}
          onSelect={selectProject}
          onNew={() => setDialog({ kind: "project" })}
        />
        <div className="border-line bg-surface flex flex-1 items-center justify-center rounded-2xl border p-10 text-center">
          <div>
            <p className="text-sm font-medium">Nenhum projeto ainda.</p>
            <p className="text-ink-muted mt-1 text-sm">
              Crie um projeto pra começar a planejar os posts.
            </p>
            {canManage && (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => setDialog({ kind: "project" })}
              >
                <Plus className="size-4" /> Novo projeto
              </Button>
            )}
          </div>
        </div>
        {dialog?.kind === "project" && (
          <ProjectDialog onClose={() => setDialog(null)} onCreated={selectProject} />
        )}
      </div>
    );
  }

  const shareUrl = `${SHARE_BASE}/social/${project.share_token}`;

  return (
    <div className="flex flex-1 gap-5 overflow-hidden p-5">
      <ProjectRail
        projects={projects}
        activeId={activeId}
        canManage={canManage}
        onSelect={selectProject}
        onNew={() => setDialog({ kind: "project" })}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ background: project.color }}
            />
            <h2 className="text-base font-semibold">{project.name}</h2>
            <span className="text-ink-muted text-sm">· {monthLabel(monthStart)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
              <TabsList>
                <TabsTrigger value="mes">
                  <CalendarDays className="size-4" /> Mês
                </TabsTrigger>
                <TabsTrigger value="kanban">
                  <Columns3 className="size-4" /> Kanban
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {view === "mes" && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => shiftMonth(-1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMonthStart(startOfMonth(new Date()))}
                >
                  Hoje
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => shiftMonth(1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={navigating}
              onClick={() => setDialog({ kind: "share" })}
            >
              <Share2 className="size-4" /> Compartilhar
            </Button>
          </div>
        </div>

        {view === "mes" ? (
          <div className="border-line bg-surface min-h-0 flex-1 overflow-auto rounded-2xl border">
            <div className="grid grid-cols-7 border-b">
              {WEEKDAY_LABELS.map((d) => (
                <div
                  key={d}
                  className="text-ink-muted border-line border-r px-2 py-1.5 text-center text-[11px] font-semibold uppercase last:border-r-0"
                >
                  {d}
                </div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day) => {
                  const key = ymd(day);
                  const inMonth = day.getMonth() === monthStart.getMonth();
                  const dayPosts = postsByDay.get(key) ?? [];
                  const dayMarkers = markersByDay.get(key) ?? [];
                  return (
                    <div
                      key={key}
                      onDragOver={(e) => canManage && e.preventDefault()}
                      onDrop={(e) => {
                        if (!canManage) return;
                        const id = e.dataTransfer.getData("text/post-id");
                        if (id) {
                          start(async () => {
                            try {
                              await movePostDate(id, key);
                            } catch (err) {
                              toast.error(actionError(err, "Falhou ao mover"));
                            }
                          });
                        }
                      }}
                      className={`border-line group/day min-h-[128px] border-r border-b p-1.5 last:border-r-0 ${
                        inMonth ? "" : "bg-surface-2/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[11px] ${
                            inMonth ? "text-ink-muted" : "text-ink-faint"
                          }`}
                        >
                          {day.getDate()}
                        </span>
                        {canManage && (
                          <div className="flex gap-0.5 opacity-0 group-hover/day:opacity-100">
                            <button
                              type="button"
                              title="Marcar dia"
                              onClick={() => setDialog({ kind: "marker", date: key })}
                              className="text-ink-muted hover:text-ink"
                            >
                              <Flag className="size-3" />
                            </button>
                            <button
                              type="button"
                              title="Novo post"
                              onClick={() =>
                                setDialog({ kind: "post", date: key, postId: null })
                              }
                              className="text-ink-muted hover:text-ink"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {dayMarkers.map((k) => (
                        <div
                          key={k.id}
                          className="mt-1 flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium"
                          style={{
                            background: `color-mix(in srgb, ${k.color} 18%, transparent)`,
                            color: k.color,
                          }}
                        >
                          <Flag className="size-2.5 shrink-0" />
                          <span className="truncate">{k.label}</span>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() =>
                                start(async () => {
                                  try {
                                    await deleteMarker(k.id);
                                  } catch (e) {
                                    toast.error(actionError(e, "Falhou"));
                                  }
                                })
                              }
                              className="ml-auto opacity-60 hover:opacity-100"
                            >
                              <Trash2 className="size-2.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      <div className="mt-1 space-y-1">
                        {dayPosts.map((p) => (
                          <PostChip
                            key={p.id}
                            post={p}
                            draggable={canManage}
                            onOpen={() =>
                              setDialog({ kind: "post", date: p.date, postId: p.id })
                            }
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <KanbanView
            posts={posts}
            canManage={canManage}
            onOpen={(p) => setDialog({ kind: "post", date: p.date, postId: p.id })}
          />
        )}
      </div>

      {dialog?.kind === "post" && (
        <PostDialog
          key={activeId ?? "none"}
          open
          onClose={() => setDialog(null)}
          projectId={project.id}
          date={dialog.date}
          post={openPost}
          canManage={canManage}
          tasks={tasks}
        />
      )}
      {dialog?.kind === "project" && (
        <ProjectDialog onClose={() => setDialog(null)} onCreated={selectProject} />
      )}
      {dialog?.kind === "marker" && (
        <MarkerDialog
          projectId={project.id}
          date={dialog.date}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "share" && (
        <ShareDialog
          key={project.id}
          project={project}
          url={shareUrl}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

/* ---------------- rail de projetos ---------------- */
function ProjectRail({
  projects,
  activeId,
  canManage,
  onSelect,
  onNew,
}: {
  projects: SocialProject[];
  activeId: string | null;
  canManage: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const [, start] = useTransition();
  const [confirmDel, setConfirmDel] = useState<SocialProject | null>(null);
  return (
    <div className="w-52 shrink-0">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-ink-muted text-[11px] font-semibold uppercase">
          Projetos
        </span>
        {canManage && (
          <button
            type="button"
            onClick={onNew}
            className="text-ink-muted hover:text-ink"
          >
            <Plus className="size-3.5" />
          </button>
        )}
      </div>
      <div className="space-y-1">
        {projects.map((p) => (
          <div
            key={p.id}
            className={`group flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm ${
              p.id === activeId
                ? "border-data/40 bg-data/5"
                : "border-transparent hover:bg-surface-2/60"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(p.id)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: p.color }}
              />
              <span className="truncate">{p.name}</span>
            </button>
            {canManage && (
              <button
                type="button"
                onClick={() => setConfirmDel(p)}
                className="text-ink-muted hover:text-gap opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {confirmDel && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
          <div className="border-line bg-surface w-full max-w-sm rounded-xl border p-5">
            <h3 className="text-sm font-semibold">Excluir “{confirmDel.name}”?</h3>
            <p className="text-ink-muted mt-1 text-sm">
              Apaga os posts, artes e marcadores junto. Não dá pra desfazer.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDel(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  start(async () => {
                    try {
                      await deleteProject(confirmDel.id);
                      toast.success("Projeto excluído");
                      setConfirmDel(null);
                    } catch (e) {
                      toast.error(actionError(e, "Falhou"));
                    }
                  })
                }
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- chip de post no calendário ---------------- */
function PostChip({
  post,
  draggable,
  onOpen,
}: {
  post: SocialPost;
  draggable: boolean;
  onOpen: () => void;
}) {
  const thumb = post.assets[0]?.image_url;
  const meta = STATUS_META[post.status] ?? STATUS_META.rascunho;
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(e) => e.dataTransfer.setData("text/post-id", post.id)}
      onClick={onOpen}
      className="border-line hover:border-data/40 flex w-full items-center gap-1.5 rounded-md border p-1 text-left"
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="size-7 shrink-0 rounded object-cover" />
      ) : (
        <span className="bg-surface-2 text-ink-faint grid size-7 shrink-0 place-items-center rounded text-[9px]">
          sem arte
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-medium">{post.title}</span>
        <span className="text-ink-faint text-[10px]">
          {post.time?.slice(0, 5) ?? "—"}
        </span>
      </span>
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: meta.dot }}
        title={meta.label}
      />
    </button>
  );
}

/* ---------------- kanban ---------------- */
function KanbanView({
  posts,
  canManage,
  onOpen,
}: {
  posts: SocialPost[];
  canManage: boolean;
  onOpen: (p: SocialPost) => void;
}) {
  const [, start] = useTransition();
  const [dragOver, setDragOver] = useState<string | null>(null);
  const byStatus = useMemo(() => {
    const m = new Map<string, SocialPost[]>();
    for (const s of SOCIAL_STATUS) m.set(s, []);
    for (const p of posts) (m.get(p.status) ?? m.get("rascunho")!).push(p);
    return m;
  }, [posts]);

  const onDrop = (status: string) => (e: DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/post-id");
    if (!id) return;
    start(async () => {
      try {
        await setPostStatus(id, status);
      } catch (err) {
        toast.error(actionError(err, "Falhou ao mover"));
      }
    });
  };

  return (
    <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto">
      {SOCIAL_STATUS.map((s) => {
        const meta = STATUS_META[s];
        const items = byStatus.get(s) ?? [];
        return (
          <section key={s} className="flex w-[260px] shrink-0 flex-col">
            <header className="mb-2 flex items-center gap-2 px-1">
              <span className="size-2 rounded-full" style={{ background: meta.dot }} />
              <h3 className="text-sm font-semibold">{meta.label}</h3>
              <span className="bg-surface-2 text-ink-muted rounded-full px-1.5 text-[11px]">
                {items.length}
              </span>
            </header>
            <div
              onDragOver={(e) => {
                if (!canManage) return;
                e.preventDefault();
                setDragOver(s);
              }}
              onDragLeave={() => setDragOver((d) => (d === s ? null : d))}
              onDrop={onDrop(s)}
              className={`flex flex-1 flex-col gap-2 overflow-y-auto rounded-xl p-2 ${
                dragOver === s ? "bg-data/10 ring-data/40 ring-1" : "bg-surface-2/40"
              }`}
            >
              {items.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  draggable={canManage}
                  onDragStart={(e) => e.dataTransfer.setData("text/post-id", p.id)}
                  onClick={() => onOpen(p)}
                  className="border-line bg-surface hover:border-data/40 rounded-lg border p-2 text-left"
                >
                  {p.assets[0]?.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.assets[0].image_url}
                      alt=""
                      className="mb-1.5 h-24 w-full rounded object-cover"
                    />
                  )}
                  <span className="block truncate text-sm font-medium">{p.title}</span>
                  <span className="text-ink-muted text-[11px]">
                    {p.date} · {p.time?.slice(0, 5) ?? "—"}
                  </span>
                </button>
              ))}
              {items.length === 0 && (
                <p className="text-ink-faint px-2 py-6 text-center text-xs">Vazio</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ---------------- dialogs pequenos ---------------- */
function ProjectDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [pending, start] = useTransition();
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
      <div className="border-line bg-surface w-full max-w-sm rounded-xl border p-5">
        <h3 className="text-sm font-semibold">Novo projeto</h3>
        <label className="mt-3 block">
          <span className="text-ink-muted text-[11px] font-semibold uppercase">Nome</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: @marca-cliente"
            className="border-line-strong focus:border-data mt-1 h-9 w-full rounded-md border bg-transparent px-2.5 text-sm outline-none"
          />
        </label>
        <div className="mt-3">
          <span className="text-ink-muted text-[11px] font-semibold uppercase">Cor</span>
          <div className="mt-1.5 flex gap-1.5">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`size-6 rounded-full ${
                  color === c ? "ring-ink ring-2 ring-offset-2 ring-offset-[var(--surface)]" : ""
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={pending || !name.trim()}
            onClick={() =>
              start(async () => {
                try {
                  const r = await createProject(name, color);
                  toast.success("Projeto criado");
                  onClose();
                  onCreated(r.id);
                } catch (e) {
                  toast.error(actionError(e, "Falhou ao criar"));
                }
              })
            }
          >
            Criar
          </Button>
        </div>
      </div>
    </div>
  );
}

function MarkerDialog({
  projectId,
  date,
  onClose,
}: {
  projectId: string;
  date: string;
  onClose: () => void;
}) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[2]);
  const [pending, start] = useTransition();
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
      <div className="border-line bg-surface w-full max-w-sm rounded-xl border p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Flag className="size-3.5" /> Marcar dia · {date}
        </h3>
        <label className="mt-3 block">
          <span className="text-ink-muted text-[11px] font-semibold uppercase">Descrição</span>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex.: Black Friday, Live, Feriado"
            className="border-line-strong focus:border-data mt-1 h-9 w-full rounded-md border bg-transparent px-2.5 text-sm outline-none"
          />
        </label>
        <div className="mt-3 flex gap-1.5">
          {PROJECT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`size-6 rounded-full ${
                color === c ? "ring-ink ring-2 ring-offset-2 ring-offset-[var(--surface)]" : ""
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={pending || !label.trim()}
            onClick={() =>
              start(async () => {
                try {
                  await addMarker(projectId, date, label, color);
                  toast.success("Dia marcado");
                  onClose();
                } catch (e) {
                  toast.error(actionError(e, "Falhou"));
                }
              })
            }
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

function ShareDialog({
  project,
  url,
  onClose,
}: {
  project: SocialProject;
  url: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState(url);
  const expLabel = project.share_expires_at
    ? `expira em ${new Date(project.share_expires_at).toLocaleDateString("pt-BR")}`
    : "sem expiração";
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
      <div className="border-line bg-surface w-full max-w-md rounded-xl border p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Share2 className="size-4" /> Compartilhar com o cliente
        </h3>
        <p className="text-ink-muted mt-1 text-sm">
          Link público pro cliente ver o calendário, aprovar/pedir ajuste e comentar
          sem login.
        </p>
        <div className="border-line-strong mt-3 flex items-center gap-2 rounded-lg border px-3 py-2">
          <Link2 className="size-3.5 shrink-0" />
          <span className="text-data-text min-w-0 flex-1 truncate text-xs">{current}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(current);
              toast.success("Link copiado");
            }}
            className="text-ink-muted hover:text-ink text-xs"
          >
            copiar
          </button>
        </div>
        <p className="text-ink-faint mt-1.5 text-[11px]">
          {expLabel}
          {project.share_last_viewed_at &&
            ` · visto por último ${new Date(project.share_last_viewed_at).toLocaleString("pt-BR")}`}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                try {
                  const r = await regenShareToken(project.id);
                  setCurrent(
                    current.replace(/\/social\/[^/]+$/, `/social/${r.token}`),
                  );
                  toast.success("Novo link — o anterior parou de funcionar");
                  router.refresh();
                } catch (e) {
                  toast.error(actionError(e, "Falhou"));
                }
              })
            }
          >
            Gerar novo link (invalida o anterior)
          </Button>
          <select
            defaultValue={project.share_expires_at ? "" : "0"}
            onChange={(e) => {
              const v = e.target.value;
              start(async () => {
                try {
                  await setShareExpiry(project.id, v === "0" ? null : Number(v));
                  toast.success("Expiração atualizada");
                  router.refresh();
                } catch (err) {
                  toast.error(actionError(err, "Falhou"));
                }
              });
            }}
            className="border-line-strong h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
          >
            <option value="0">Sem expiração</option>
            <option value="30">Expira em 30 dias</option>
            <option value="60">Expira em 60 dias</option>
            <option value="90">Expira em 90 dias</option>
          </select>
        </div>

        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
