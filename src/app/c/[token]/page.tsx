import { notFound } from "next/navigation";

import { getPublicCronograma } from "@/lib/cronogramas/queries";
import type { CronogramaItemStatus } from "@/lib/cronogramas/types";

// cache curto: token é público, conteúdo muda pouco; revalida sob demanda
export const revalidate = 120;
export const metadata = { title: "Cronograma" };

const STATUS_DOT: Record<CronogramaItemStatus, string> = {
  concluido: "var(--done)",
  em_andamento: "var(--wip)",
  agendado: "var(--data)",
  a_fazer: "var(--ink-muted)",
};
const STATUS_LABEL: Record<CronogramaItemStatus, string> = {
  concluido: "Concluído",
  em_andamento: "Em andamento",
  agendado: "Agendado",
  a_fazer: "A fazer",
};

function fmt(d: string | null) {
  if (!d) return null;
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export default async function PublicCronogramaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // 404 idêntico: token inválido e cronograma inexistente não se distinguem
  if (!token || token.length < 8) notFound();
  const c = await getPublicCronograma(token);
  if (!c) notFound();

  const total = c.fases.reduce((s, f) => s + f.items.length, 0);
  const done = c.fases.reduce(
    (s, f) => s + f.items.filter((i) => i.status === "concluido").length,
    0,
  );
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="border-line border-b pb-5">
        <h1 className="text-xl font-bold">{c.title}</h1>
        {c.description && (
          <p className="text-ink-muted mt-1 text-sm">{c.description}</p>
        )}
        <p className="text-ink-muted mt-2 text-xs">
          {fmt(c.startDate) ?? "—"} → {fmt(c.endDate) ?? "—"} · {done}/{total}{" "}
          itens · {pct}%
        </p>
        <div className="bg-surface-2 mt-2 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-data h-full rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      <div className="mt-6 space-y-6">
        {c.fases.map((f, i) => (
          <section key={i}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold">
                {f.title}
                {i === c.currentFaseIndex && (
                  <span className="text-data-text ml-2 text-xs">· agora</span>
                )}
              </h2>
              {f.intervalLabel && (
                <span className="text-ink-muted text-xs">{f.intervalLabel}</span>
              )}
            </div>
            {f.note && <p className="text-ink-muted mt-1 text-xs">{f.note}</p>}
            <ul className="mt-2 space-y-1.5">
              {f.items.map((it, j) => (
                <li
                  key={j}
                  className="border-line flex items-center gap-2 rounded-lg border p-2.5 text-sm"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: STATUS_DOT[it.status] }}
                  />
                  <span className="min-w-0 flex-1">{it.text}</span>
                  {it.date && (
                    <span className="text-ink-muted text-[11px]">
                      {fmt(it.date)}
                    </span>
                  )}
                  <span className="text-ink-muted text-[11px]">
                    {STATUS_LABEL[it.status]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {c.checklists.map((cl, i) => (
          <section key={`cl${i}`}>
            <h2 className="text-base font-semibold">
              {cl.title}{" "}
              <span className="text-ink-muted font-normal">
                {cl.items.filter((x) => x.done).length}/{cl.items.length}
              </span>
            </h2>
            <ul className="mt-2 space-y-1">
              {cl.items.map((x, j) => (
                <li key={j} className="flex items-center gap-2 text-sm">
                  <span
                    className={`grid size-4 place-items-center rounded border text-[10px] ${
                      x.done
                        ? "border-done text-done"
                        : "border-line text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className={x.done ? "text-ink-muted line-through" : ""}>
                    {x.text}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {c.secoes.map((s, i) => (
          <section key={`s${i}`}>
            <h2 className="text-base font-semibold">{s.title}</h2>
            <div className="mt-2 space-y-2">
              {s.blocks.map((b, j) => (
                <div key={j} className="border-line rounded-lg border p-2.5">
                  <div className="text-sm font-medium">{b.heading}</div>
                  {b.meta && (
                    <div className="text-ink-muted text-[11px]">{b.meta}</div>
                  )}
                  {b.notes.length > 0 && (
                    <ul className="text-ink-muted mt-1 list-disc space-y-0.5 pl-4 text-xs">
                      {b.notes.map((n, k) => (
                        <li key={k}>{n}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="border-line text-ink-muted mt-10 border-t pt-4 text-center text-[11px]">
        Cronograma compartilhado · Emerge
      </footer>
    </main>
  );
}
