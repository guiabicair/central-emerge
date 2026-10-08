"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";

import {
  PLATFORM_LABEL,
  STATUS_META,
} from "@/app/(app)/calendario-social/social-constants";
import type { SocialPost } from "@/lib/social/queries";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { driveFileId, SocialMedia, SocialMediaFrame } from "./social-media";

const FORMAT_LABEL: Record<string, string> = {
  feed_4_5: "Feed · 4:5",
  carrossel_1_1: "Carrossel · 1:1",
  stories_9_16: "Stories · 9:16",
  reels_9_16: "Reels · 9:16",
  tiktok_9_16: "TikTok · 9:16",
  linkedin_1_1: "LinkedIn · 1:1",
  youtube_16_9: "YouTube · 16:9",
  x_16_9: "X · 16:9",
};

function Block({ title, text }: { title: string; text: string | null }) {
  if (!text) return null;
  return (
    <section>
      <h3 className="text-ink-muted text-[11px] font-semibold uppercase">{title}</h3>
      <p className="mt-1 text-sm whitespace-pre-wrap">{text}</p>
    </section>
  );
}

/** Post em modo leitura: mídia grande no formato certo + textos + comentários. */
export function PostView({
  post,
  canManage,
  onClose,
  onEdit,
}: {
  post: SocialPost;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [activeId, setActiveId] = useState(post.assets[0]?.id ?? null);
  const active = post.assets.find((a) => a.id === activeId) ?? post.assets[0] ?? null;
  const meta = STATUS_META[post.status] ?? STATUS_META.rascunho;

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-[760px]">
        <SheetHeader className="border-line border-b p-5 pr-12">
          <SheetTitle className="flex flex-wrap items-center gap-2 text-base font-semibold">
            {post.title}
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                background: `color-mix(in srgb, ${meta.dot} 15%, transparent)`,
                color: meta.color,
              }}
            >
              {meta.label}
            </span>
          </SheetTitle>
          <div className="text-ink-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span>
              {post.date.split("-").reverse().join("/")}
              {post.time ? ` · ${post.time.slice(0, 5)}` : ""}
            </span>
            {post.platforms.length > 0 && (
              <span>{post.platforms.map((p) => PLATFORM_LABEL[p] ?? p).join(" · ")}</span>
            )}
          </div>
          {canManage && (
            <div>
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Pencil className="size-3.5" /> Editar post
              </Button>
            </div>
          )}
        </SheetHeader>

        <div className="space-y-5 p-5">
          {active ? (
            <div className="space-y-2">
              <SocialMediaFrame src={active.image_url} format={active.format} />
              <div className="text-ink-muted flex items-center justify-between text-xs">
                <span>{FORMAT_LABEL[active.format] ?? active.format}</span>
                <a
                  href={active.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {driveFileId(active.image_url) ? "Abrir no Drive ↗" : "Abrir em nova aba ↗"}
                </a>
              </div>
              {post.assets.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {post.assets.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setActiveId(a.id)}
                      title={FORMAT_LABEL[a.format] ?? a.format}
                      className={`rounded-md ${a.id === active.id ? "ring-data ring-2" : "opacity-70 hover:opacity-100"}`}
                    >
                      <SocialMedia
                        src={a.image_url}
                        className="border-line size-16 rounded-md border object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface-2 text-ink-faint grid h-40 place-items-center rounded-lg text-sm">
              Nenhuma arte ou vídeo ainda
            </div>
          )}

          <Block title="Legenda" text={post.legenda} />
          <Block title="Ideia" text={post.ideia} />
          <Block title="Objetivo" text={post.objetivo} />

          {post.task_id && (
            <Link
              href={`/tarefas?open=${post.task_id}`}
              className="text-data-text inline-block text-xs hover:underline"
            >
              abrir tarefa vinculada ↗
            </Link>
          )}

          {post.comments.length > 0 && (
            <section>
              <h3 className="text-ink-muted text-[11px] font-semibold uppercase">
                Comentários ({post.comments.length})
              </h3>
              <ul className="mt-2 space-y-2">
                {post.comments.map((c) => (
                  <li key={c.id} className="bg-surface-2/60 rounded-md px-3 py-2 text-sm">
                    <div className="text-ink-muted text-[11px]">
                      {c.author_name ?? "Equipe"} ·{" "}
                      {new Date(c.created_at).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap">{c.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
