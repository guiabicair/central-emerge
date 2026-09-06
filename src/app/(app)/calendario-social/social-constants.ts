/** Constantes/tipos do Calendário Social. Fora de "use server" (só funcao async lá). */

export const SOCIAL_PLATFORMS = [
  "feed",
  "carrossel",
  "stories",
  "reels",
  "tiktok",
  "linkedin",
  "youtube",
  "x",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const PLATFORM_LABEL: Record<string, string> = {
  feed: "Feed",
  carrossel: "Carrossel",
  stories: "Stories",
  reels: "Reels",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  x: "X / Twitter",
};

/** Proporção sugerida por plataforma (usada pra criar os slots de "arte por formato"). */
export const PLATFORM_FORMAT: Record<string, { format: string; ratio: string }> = {
  feed: { format: "feed_4_5", ratio: "4:5" },
  carrossel: { format: "carrossel_1_1", ratio: "1:1" },
  stories: { format: "stories_9_16", ratio: "9:16" },
  reels: { format: "reels_9_16", ratio: "9:16" },
  tiktok: { format: "tiktok_9_16", ratio: "9:16" },
  linkedin: { format: "linkedin_1_1", ratio: "1:1" },
  youtube: { format: "youtube_16_9", ratio: "16:9" },
  x: { format: "x_16_9", ratio: "16:9" },
};

export const SOCIAL_STATUS = [
  "rascunho",
  "em_aprovacao",
  "aprovado",
  "reprovado",
  "publicado",
] as const;
export type SocialStatus = (typeof SOCIAL_STATUS)[number];

export const STATUS_META: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  rascunho: { label: "Rascunho", color: "var(--ink-muted)", dot: "var(--ink-muted)" },
  em_aprovacao: { label: "Em aprovação", color: "var(--warn)", dot: "var(--warn)" },
  aprovado: { label: "Aprovado", color: "var(--done)", dot: "var(--done)" },
  reprovado: { label: "Reprovado", color: "var(--gap)", dot: "var(--gap)" },
  publicado: { label: "Publicado", color: "var(--data)", dot: "var(--data)" },
};

export const PROJECT_COLORS = [
  "#45f0d1",
  "#c9ff3f",
  "#f2b544",
  "#e95e9d",
  "#5b8def",
  "#a06bff",
  "#ff6b6b",
  "#4ade80",
];

export interface PostInput {
  date: string; // yyyy-mm-dd
  time: string | null; // HH:MM
  title: string;
  platforms: string[];
  ideia: string;
  objetivo: string;
  legenda: string;
  task_id: string | null;
}
