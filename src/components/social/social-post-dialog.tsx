"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import {
  addComment,
  createPost,
  deleteAsset,
  deletePost,
  setPostStatus,
  updatePost,
  uploadAsset,
} from "@/app/(app)/calendario-social/actions";
import {
  PLATFORM_FORMAT,
  PLATFORM_LABEL,
  SOCIAL_PLATFORMS,
  STATUS_META,
  type PostInput,
} from "@/app/(app)/calendario-social/social-constants";
import type { SocialPost } from "@/lib/social/queries";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { actionError } from "@/lib/utils";

const field =
  "border-line-strong focus:border-data h-9 w-full rounded-md border bg-transparent px-2.5 text-sm outline-none";
const area =
  "border-line-strong focus:border-data w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none";

function blank(date: string): PostInput {
  return {
    date,
    time: "12:00",
    title: "",
    platforms: ["feed"],
    ideia: "",
    objetivo: "",
    legenda: "",
    task_id: null,
  };
}

export function PostDialog({
  open,
  onClose,
  projectId,
  date,
  post,
  canManage,
  tasks,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  date: string;
  post: SocialPost | null;
  canManage: boolean;
  tasks: { id: string; title: string }[];
}) {
  const initial: PostInput = post
    ? {
        date: post.date,
        time: post.time?.slice(0, 5) ?? null,
        title: post.title,
        platforms: post.platforms ?? [],
        ideia: post.ideia ?? "",
        objetivo: post.objetivo ?? "",
        legenda: post.legenda ?? "",
        task_id: post.task_id,
      }
    : blank(date);

  const [form, setForm] = useState<PostInput>(initial);
  const [pending, start] = useTransition();
  const [comment, setComment] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadFmt, setUploadFmt] = useState("feed_4_5");

  const set = <K extends keyof PostInput>(k: K, v: PostInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const togglePlatform = (p: string) =>
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter((x) => x !== p)
        : [...f.platforms, p],
    }));

  const formats = useMemo(() => {
    const seen = new Set<string>();
    const out: { format: string; ratio: string; label: string }[] = [];
    for (const p of form.platforms) {
      const f = PLATFORM_FORMAT[p];
      if (f && !seen.has(f.format)) {
        seen.add(f.format);
        out.push({ ...f, label: PLATFORM_LABEL[p] ?? p });
      }
    }
    return out.length ? out : [{ format: "feed_4_5", ratio: "4:5", label: "Feed" }];
  }, [form.platforms]);

  function save() {
    if (!form.title.trim()) return toast.error("Título é obrigatório.");
    start(async () => {
      try {
        if (post) await updatePost(post.id, form);
        else await createPost(projectId, form);
        toast.success(post ? "Post atualizado" : "Post criado");
        onClose();
      } catch (e) {
        toast.error(actionError(e, "Falhou ao salvar"));
      }
    });
  }

  function doUpload(file: File) {
    if (!post) {
      toast.error("Salve o post antes de subir arte.");
      return;
    }
    const fd = new FormData();
    fd.set("post_id", post.id);
    fd.set("format", uploadFmt);
    fd.set("file", file);
    start(async () => {
      try {
        await uploadAsset(fd);
        toast.success("Arte enviada");
      } catch (e) {
        toast.error(actionError(e, "Falhou o upload"));
      }
    });
  }

  const status = post?.status ?? "rascunho";
  const linkedTask = post?.task_id
    ? tasks.find((t) => t.id === post.task_id)
    : null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-[560px]">
        <SheetHeader className="border-line border-b p-5 pr-12">
          <SheetTitle className="flex items-center gap-3 text-base font-semibold">
            {post ? "Editar post" : "Novo post"}
            {post && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  background: `color-mix(in srgb, ${STATUS_META[status].dot} 15%, transparent)`,
                  color: STATUS_META[status].color,
                }}
              >
                {STATUS_META[status].label}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-3 gap-3">
            <label className="col-span-2 block">
              <span className="text-ink-muted text-[11px] font-semibold uppercase">Título *</span>
              <input
                autoFocus
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Ex.: Lançamento coleção verão"
                className={`mt-1 ${field}`}
              />
            </label>
            <label className="block">
              <span className="text-ink-muted text-[11px] font-semibold uppercase">Horário</span>
              <input
                type="time"
                value={form.time ?? ""}
                onChange={(e) => set("time", e.target.value || null)}
                className={`mt-1 ${field}`}
              />
            </label>
          </div>

          <div>
            <span className="text-ink-muted text-[11px] font-semibold uppercase">Plataformas</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {SOCIAL_PLATFORMS.map((p) => {
                const on = form.platforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      on
                        ? "border-data/50 bg-data/10 text-data-text"
                        : "border-line text-ink-muted hover:text-ink"
                    }`}
                  >
                    {PLATFORM_LABEL[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* artes por formato */}
          <div>
            <span className="text-ink-muted text-[11px] font-semibold uppercase">Artes por formato</span>
            <p className="text-ink-muted mt-0.5 text-xs">
              Uma arte por proporção das plataformas selecionadas.
            </p>
            <div className="mt-2 space-y-2">
              {formats.map((f) => {
                const arts = (post?.assets ?? []).filter((a) => a.format === f.format);
                return (
                  <div key={f.format} className="border-line rounded-lg border p-2.5">
                    <div className="text-ink-muted flex items-center justify-between text-xs">
                      <span className="font-medium">
                        {f.label} <span className="text-ink-faint">· {f.ratio}</span>
                      </span>
                      {canManage && post && (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadFmt(f.format);
                            fileRef.current?.click();
                          }}
                          className="text-data-text inline-flex items-center gap-1 hover:underline"
                        >
                          <Upload className="size-3" /> enviar
                        </button>
                      )}
                    </div>
                    {arts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {arts.map((a) => (
                          <div key={a.id} className="group relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={a.image_url}
                              alt=""
                              className="border-line h-24 w-24 rounded-md border object-cover"
                            />
                            {canManage && (
                              <button
                                type="button"
                                onClick={() =>
                                  start(async () => {
                                    try {
                                      await deleteAsset(a.id);
                                    } catch (e) {
                                      toast.error(actionError(e, "Falhou"));
                                    }
                                  })
                                }
                                className="bg-surface border-line absolute -top-1.5 -right-1.5 hidden rounded-full border p-0.5 group-hover:block"
                              >
                                <X className="size-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) doUpload(f);
                e.target.value = "";
              }}
            />
          </div>

          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">Ideia</span>
            <textarea
              value={form.ideia}
              onChange={(e) => set("ideia", e.target.value)}
              rows={4}
              placeholder="Qual é a ideia do post?"
              className={`mt-1 ${area}`}
            />
          </label>
          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">Objetivo</span>
            <textarea
              value={form.objetivo}
              onChange={(e) => set("objetivo", e.target.value)}
              rows={2}
              placeholder="O que queremos com esse post?"
              className={`mt-1 ${area}`}
            />
          </label>
          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">Legenda</span>
            <textarea
              value={form.legenda}
              onChange={(e) => set("legenda", e.target.value)}
              rows={3}
              placeholder="Texto do post..."
              className={`mt-1 ${area}`}
            />
          </label>

          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Tarefa vinculada
            </span>
            <select
              value={form.task_id ?? ""}
              onChange={(e) => set("task_id", e.target.value || null)}
              className={`mt-1 ${field}`}
            >
              <option value="">— nenhuma —</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            {linkedTask && (
              <Link
                href={`/tarefas?open=${linkedTask.id}`}
                className="text-data-text mt-1 inline-block text-[11px] hover:underline"
              >
                abrir tarefa ↗
              </Link>
            )}
          </label>
        </div>

        {/* aprovação interna */}
        {post && canManage && (
          <div className="border-line flex flex-wrap gap-2 border-t p-4">
            {status !== "em_aprovacao" && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    try {
                      await setPostStatus(post.id, "em_aprovacao");
                      toast.success("Enviado pra aprovação");
                    } catch (e) {
                      toast.error(actionError(e, "Falhou"));
                    }
                  })
                }
              >
                Enviar pra aprovação
              </Button>
            )}
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  try {
                    await setPostStatus(post.id, "aprovado");
                    toast.success("Aprovado");
                  } catch (e) {
                    toast.error(actionError(e, "Falhou"));
                  }
                })
              }
            >
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  try {
                    await setPostStatus(post.id, "publicado");
                    toast.success("Marcado como publicado");
                  } catch (e) {
                    toast.error(actionError(e, "Falhou"));
                  }
                })
              }
            >
              Publicado
            </Button>
          </div>
        )}

        {/* comentários */}
        {post && (
          <div className="border-line border-t p-5">
            <p className="text-sm font-semibold">
              Comentários{" "}
              <span className="text-ink-muted font-normal">({post.comments.length})</span>
            </p>
            <div className="mt-3 space-y-3">
              {post.comments.length === 0 && (
                <p className="text-ink-muted text-xs">Nenhum comentário ainda.</p>
              )}
              {post.comments.map((c) => (
                <div key={c.id} className="text-sm">
                  <span className="text-ink-muted text-[11px] font-semibold">
                    {c.author_name ?? "Equipe"}
                  </span>
                  <p className="mt-0.5">{c.body}</p>
                </div>
              ))}
            </div>
            {canManage && (
              <div className="mt-3 flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Adicionar comentário..."
                  className={field}
                />
                <Button
                  size="sm"
                  disabled={pending || !comment.trim()}
                  onClick={() =>
                    start(async () => {
                      try {
                        await addComment(post.id, comment);
                        setComment("");
                      } catch (e) {
                        toast.error(actionError(e, "Falhou"));
                      }
                    })
                  }
                >
                  Enviar
                </Button>
              </div>
            )}
          </div>
        )}

        {canManage && (
          <div className="border-line flex items-center justify-between gap-2 border-t p-4">
            {post ? (
              <button
                type="button"
                onClick={() =>
                  start(async () => {
                    try {
                      await deletePost(post.id);
                      toast.success("Post excluído");
                      onClose();
                    } catch (e) {
                      toast.error(actionError(e, "Falhou"));
                    }
                  })
                }
                className="text-gap inline-flex items-center gap-1 text-xs hover:underline"
              >
                <Trash2 className="size-3.5" /> Excluir post
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                {post ? "Fechar" : "Cancelar"}
              </Button>
              <Button type="button" size="sm" disabled={pending} onClick={save}>
                {pending ? "Salvando…" : post ? "Salvar" : "Criar post"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
