/**
 * Parser dos 2 cronogramas de referência (docs/cronogramas-ref/*.html) →
 * src/lib/cronogramas/seed-ref.ts. Roda uma vez; a app consome o seed
 * estático, não parseia HTML em runtime. `node scripts/parse-cronogramas-ref.mjs`
 */
import { readFileSync, writeFileSync } from "node:fs";

const CHIP_STATUS = {
  done: "concluido",
  doing: "em_andamento",
  progress: "em_andamento",
  scheduled: "agendado",
  pending: "a_fazer",
};

const strip = (s) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const between = (html, cls) => {
  // conteúdo de <tag class="… cls …">…</tag>. cls exato (não casa cls-foo).
  const out = [];
  const re = new RegExp(
    `<([a-z]+)[^>]*class="[^"]*\\b${cls}(?![-\\w])[^"]*"[^>]*>([\\s\\S]*?)</\\1>`,
    "gi",
  );
  let m;
  while ((m = re.exec(html))) out.push(m[2]);
  return out;
};

function parseFile(path) {
  let html = readFileSync(path, "utf8");
  html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");

  const title =
    strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "") ||
    "Cronograma";
  const lede = strip((between(html, "lede")[0] || "").slice(0, 400)) || null;

  // ponteiro "estamos aqui agora"
  const bannerLabel = strip(between(html, "label")[0] || "");
  const bannerValue = strip(between(html, "value")[0] || "");
  const pointer = [bannerLabel, bannerValue].filter(Boolean).join(" — ") || null;

  // fases: <div class="phase ..."> — 'phase' seguido de espaço ou aspas,
  // NUNCA 'phase-*' (phase-when/phase-card/phase-marker são internos).
  const faseBlocks = [];
  const faseRe =
    /<div[^>]*class="phase(?=[ "])[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="phase(?=[ "])|<section|<h2)/gi;
  let fm;
  while ((fm = faseRe.exec(html))) faseBlocks.push(fm[0]);

  const fases = faseBlocks.map((blk, idx) => {
    const isCurrent = /class="[^"]*\bphase\b[^"]*\bcurrent\b/i.test(blk);
    const intervalLabel = strip(between(blk, "phase-when")[0] || "") || null;
    const faseTitle =
      strip((blk.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) || [])[1] || "") ||
      `Fase ${idx + 1}`;

    const items = [];
    const taskRe =
      /<div[^>]*class="[^"]*\btask\b[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*\btask\b|<\/div>)/gi;
    let tm;
    const taskArea = (blk.match(/class="[^"]*\btasks\b[\s\S]*/i) || [blk])[0];
    while ((tm = taskRe.exec(taskArea))) {
      const raw = tm[1];
      const chipCls = (raw.match(/class="[^"]*\bchip\b\s+([a-z]+)/i) || [])[1];
      const text = strip(between(raw, "txt")[0] || raw);
      if (text)
        items.push({
          text,
          status: CHIP_STATUS[chipCls] || "a_fazer",
          date: null,
          taskId: null,
        });
    }
    // fallback: se .tasks não casou, pega <li>
    if (items.length === 0) {
      const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let lm;
      const liArea = (blk.match(/class="[^"]*\b(deliverables|tasks)\b[\s\S]*/i) || [blk])[0];
      while ((lm = liRe.exec(liArea))) {
        const text = strip(lm[1]);
        if (text) items.push({ text, status: "a_fazer", date: null, taskId: null });
      }
    }

    return {
      title: faseTitle,
      note: null,
      intervalLabel,
      startDate: null,
      endDate: null,
      items,
      __current: isCurrent,
    };
  });

  const currentFaseIndex = fases.findIndex((f) => f.__current);
  fases.forEach((f) => delete f.__current);

  // checklists: <h2>…</h2> seguido de itens com checkbox (.gmn-item / bold)
  const checklists = [];
  const h2Re = /<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2|<\/body|$)/gi;
  let hm;
  while ((hm = h2Re.exec(html))) {
    const h2t = strip(hm[1]);
    if (!/checklist/i.test(h2t)) continue;
    const body = hm[2];
    const items = [];
    // gmn-item pattern (rehabilite)
    for (const gi of between(body, "gmn-item")) {
      const t = strip(between(gi, "txt")[0] || gi);
      const done = /class="[^"]*\bgmn-check\b[^"]*\bon\b/i.test(gi) ||
        /checked/i.test(gi);
      if (t) items.push({ text: t, done });
    }
    // fallback: <b>/<strong> lines (dsec)
    if (items.length === 0) {
      const bRe = /<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>/gi;
      let bm;
      while ((bm = bRe.exec(body))) {
        const t = strip(bm[1]);
        if (t && !/^\d+(\s*\/\s*\d+)?$/.test(t) && t.length > 2)
          items.push({ text: t, done: false });
      }
    }
    if (items.length) checklists.push({ title: h2t, items });
  }

  // seções de conteúdo (rehabilite: roteiro-grid / modelo mensal).
  // Split por marcador .shot-head (regex não faz tag balanceada).
  const secoes = [];
  const gridM = html.match(
    /class="roteiro-grid"[^>]*>([\s\S]*?)<\/(?:section|div)>\s*(?=<h2|<section|<footer|<\/body)/i,
  );
  if (gridM) {
    const grid = gridM[1];
    const heads = [
      ...grid.matchAll(/<[a-z0-9]+[^>]*class="[^"]*\bshot-head\b[^"]*"[^>]*>([\s\S]*?)<\/[a-z0-9]+>/gi),
    ];
    const blocks = heads.map((h, i) => {
      const chunk = grid.slice(
        h.index,
        i + 1 < heads.length ? heads[i + 1].index : grid.length,
      );
      const notes = [
        ...chunk.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi),
      ].map((m) => strip(m[1])).filter(Boolean);
      const h3 = strip((chunk.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) || [])[1] || "");
      const pill = strip((chunk.match(/class="[^"]*\bpill\b[^"]*"[^>]*>([\s\S]*?)</i) || [])[1] || "");
      const dur = strip((chunk.match(/class="[^"]*\bdur\b[^"]*"[^>]*>\s*<[^>]*>?([\s\S]*?)<\//i) || [])[1] || "")
        .replace(/^Dura[çc][aã]o estimada:?\s*/i, "");
      return {
        heading: [strip(h[1]), h3].filter(Boolean).join(" — "),
        meta: [pill, dur].filter(Boolean).join(" · ") || null,
        notes,
      };
    });
    if (blocks.length)
      secoes.push({ kind: "roteiro", title: "Roteiro de gravação — 1ª diária", blocks });
  }

  return {
    title: strip(title),
    description: lede,
    startDate: null,
    endDate: null,
    pointer,
    currentFaseIndex: currentFaseIndex >= 0 ? currentFaseIndex : null,
    fases,
    checklists,
    secoes,
  };
}

const dsec = parseFile("docs/cronogramas-ref/cronograma-dsec.html");
const rehab = parseFile("docs/cronogramas-ref/cronograma-rehabilite-me.html");

const banner = `// GERADO por scripts/parse-cronogramas-ref.mjs a partir de docs/cronogramas-ref/*.html
// Não edite à mão — rode o script de novo. Consumido pelo seed dos 2 cronogramas.
import type { CronogramaTree } from "@/lib/cronogramas/types";
`;

writeFileSync(
  "src/lib/cronogramas/seed-ref.ts",
  banner +
    `\nexport const SEED_REF: Record<string, CronogramaTree & { pointer: string | null }> = ${JSON.stringify(
      { dsec, rehabiliteMe: rehab },
      null,
      2,
    )} as const;\n`,
);

console.log("dsec:", dsec.fases.length, "fases,", dsec.checklists.length, "checklists,", dsec.secoes.length, "secoes");
console.log("rehab:", rehab.fases.length, "fases,", rehab.checklists.length, "checklists,", rehab.secoes.length, "secoes");
console.log(JSON.stringify(dsec, null, 2).slice(0, 1600));
