"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  PLATFORM_LABEL,
  STATUS_META,
} from "@/app/(app)/calendario-social/social-constants";
import { createClient } from "@/lib/supabase/client";

interface PubComment {
  id: string;
  body: string;
  author: string;
  is_client: boolean;
  created_at: string;
}
interface PubAsset {
  id: string;
  format: string;
  image_url: string;
  sort: number;
}
interface PubPost {
  id: string;
  date: string;
  time: string | null;
  title: string;
  platforms: string[];
  ideia: string | null;
  objetivo: string | null;
  legenda: string | null;
  status: string;
  assets: PubAsset[];
  comments: PubComment[];
}
interface ShareData {
  project: { id: string; name: string; color: string };
  markers: { id: string; date: string; label: string; color: string }[];
  posts: PubPost[];
}

function fmtDay(d: string) {
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function SocialPublicView({
  token,
  data: dataProp,
}: {
  token: string;
  data: unknown;
}) {
  const data = dataProp as ShareData;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: { message: string } | null }>;
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const posts = data.posts ?? [];
  const markers = data.markers ?? [];
  const approved = posts.filter((p) => p.status === "aprovado" || p.status === "publicado").length;

  const grouped = useMemo(() => {
    const m = new Map<string, PubPost[]>();
    for (const p of posts) {
      const arr = m.get(p.date) ?? [];
      arr.push(p);
      m.set(p.date, arr);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [posts]);
  const markersByDay = useMemo(() => {
    const m = new Map<string, ShareData["markers"]>();
    for (const k of markers) {
      const arr = m.get(k.date) ?? [];
      arr.push(k);
      m.set(k.date, arr);
    }
    return m;
  }, [markers]);

  function review(postId: string, decision: "aprovado" | "reprovado") {
    const comment = drafts[postId]?.trim() ?? "";
    if (decision === "reprovado" && !comment) {
      toast.error("Escreva o ajuste que você quer.");
      return;
    }
    start(async () => {
      const { error } = await rpc("social_public_review", {
        p_token: token,
        p_post_id: postId,
        p_decision: decision,
        p_comment: comment,
        p_name: name,
        p_ip: "",
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setDrafts((d) => ({ ...d, [postId]: "" }));
      toast.success(decision === "aprovado" ? "Post aprovado" : "Ajuste enviado");
      router.refresh();
    });
  }

  function comment(postId: string) {
    const body = drafts[postId]?.trim() ?? "";
    if (!body) return;
    start(async () => {
      const { error } = await rpc("social_public_comment", {
        p_token: token,
        p_post_id: postId,
        p_name: name,
        p_body: body,
        p_ip: "",
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setDrafts((d) => ({ ...d, [postId]: "" }));
      toast.success("Comentário enviado");
      router.refresh();
    });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <header className="border-line border-b pb-5">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ background: data.project.color }}
          />
          <h1 className="text-lg font-bold">{data.project.name}</h1>
        </div>
        <p className="text-ink-muted mt-1 text-sm">
          Calendário de posts — aprove ou peça ajustes direto aqui.
        </p>
        <div className="mt-3">
          <div className="text-ink-muted flex items-center justify-between text-[11px]">
            <span>
              {approved}/{posts.length} aprovados
            </span>
            <span>
              {posts.length ? Math.round((approved / posts.length) * 100) : 0}%
            </span>
          </div>
          <div className="bg-surface-2 mt-1 h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-done h-full rounded-full"
              style={{
                width: `${posts.length ? (approved / posts.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
        <label className="mt-4 block">
          <span className="text-ink-muted text-[11px] font-semibold uppercase">
            Seu nome (aparece nos comentários)
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Marina (cliente)"
            className="border-line-strong focus:border-data mt-1 h-9 w-full rounded-md border bg-transparent px-2.5 text-sm outline-none"
          />
        </label>
      </header>

      <div className="mt-6 space-y-6">
        {grouped.length === 0 && (
          <p className="text-ink-muted text-sm">Nenhum post ainda.</p>
        )}
        {grouped.map(([day, dayPosts]) => (
          <section key={day}>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold capitalize">{fmtDay(day)}</h2>
              {(markersByDay.get(day) ?? []).map((k) => (
                <span
                  key={k.id}
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    background: `color-mix(in srgb, ${k.color} 18%, transparent)`,
                    color: k.color,
                  }}
                >
                  {k.label}
                </span>
              ))}
            </div>

            <div className="mt-2 space-y-4">
              {dayPosts.map((p) => {
                const meta = STATUS_META[p.status] ?? STATUS_META.rascunho;
                const canAct = p.status === "em_aprovacao";
                return (
                  <article
                    key={p.id}
                    className="border-line bg-surface overflow-hidden rounded-2xl border"
                  >
                    {p.assets[0] && (
                      <div className="bg-surface-2 flex gap-2 overflow-x-auto p-2">
                        {p.assets.map((a) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={a.id}
                            src={a.image_url}
                            alt=""
                            className="max-h-80 rounded-lg object-contain"
                          />
                        ))}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{p.title}</h3>
                          <p className="text-ink-muted text-xs">
                            {p.time?.slice(0, 5) ?? "—"}
                            {p.platforms.length
                              ? " · " +
                                p.platforms
                                  .map((x) => PLATFORM_LABEL[x] ?? x)
                                  .join(", ")
                              : ""}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            background: `color-mix(in srgb, ${meta.dot} 15%, transparent)`,
                            color: meta.color,
                          }}
                        >
                          {meta.label}
                        </span>
                      </div>

                      {p.ideia && (
                        <p className="text-ink-muted mt-2 text-sm whitespace-pre-line">
                          {p.ideia}
                        </p>
                      )}
                      {p.legenda && (
                        <p className="border-line mt-2 border-l-2 pl-3 text-sm whitespace-pre-line">
                          {p.legenda}
                        </p>
                      )}

                      {/* comentários */}
                      {p.comments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {p.comments.map((c) => (
                            <div key={c.id} className="text-sm">
                              <span
                                className={`text-[11px] font-semibold ${
                                  c.is_client ? "text-data-text" : "text-ink-muted"
                                }`}
                              >
                                {c.author}
                              </span>
                              <p className="mt-0.5">{c.body}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ação */}
                      <div className="mt-3">
                        <textarea
                          value={drafts[p.id] ?? ""}
                          onChange={(e) =>
                            setDrafts((d) => ({ ...d, [p.id]: e.target.value }))
                          }
                          rows={2}
                          placeholder={
                            canAct
                              ? "Comentário (obrigatório se pedir ajuste)"
                              : "Comentar..."
                          }
                          className="border-line-strong focus:border-data w-full rounded-md border bg-transparent px-2.5 py-2 text-sm outline-none"
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                          {canAct ? (
                            <>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => review(p.id, "aprovado")}
                                className="bg-done/15 text-done rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                              >
                                ✓ Aprovar
                              </button>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => review(p.id, "reprovado")}
                                className="bg-gap/15 text-gap rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                              >
                                Pedir ajuste
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={pending || !(drafts[p.id]?.trim())}
                              onClick={() => comment(p.id)}
                              className="border-line rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                            >
                              Comentar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <footer className="border-line text-ink-muted mt-10 border-t pt-4 text-center text-[11px]">
        Calendário compartilhado · Emerge
      </footer>
    </main>
  );
}
