import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * As chaves antigas (aqua/lime/green/…) são mantidas por compatibilidade
 * com os mapas de status espalhados pelos módulos. O valor agora deriva
 * 100% de tokens semânticos (Item 1 · Bloco 0) — sem hex.
 *
 *   aqua → --data   lime → --action   green → --done   violet → --auto
 *   blue → --wip    amber → --warn    rose → --gap     slate → neutro
 */
export type PillColor =
  | "aqua"
  | "lime"
  | "green"
  | "violet"
  | "blue"
  | "amber"
  | "rose"
  | "slate";

/** valor CSS (var de token) para uso em `style=` — dots do calendário, etc. */
export const PILL_HEX: Record<PillColor, string> = {
  aqua: "var(--data)",
  lime: "var(--action)",
  green: "var(--done)",
  violet: "var(--auto)",
  blue: "var(--wip)",
  amber: "var(--warn)",
  rose: "var(--gap)",
  slate: "var(--ink-muted)",
};

const PILL_CLASSES: Record<PillColor, string> = {
  aqua: "bg-data/12 text-data-text border-data/25",
  lime: "bg-action/12 text-action-text border-action/25",
  green: "bg-done/12 text-done border-done/25",
  violet: "bg-auto/12 text-auto border-auto/25",
  blue: "bg-wip/12 text-wip border-wip/25",
  amber: "bg-warn/12 text-warn border-warn/25",
  rose: "bg-gap/12 text-gap border-gap/25",
  slate: "bg-ink-muted/12 text-ink-muted border-line",
};

export function StatusPill({
  color,
  children,
  className,
}: {
  color: PillColor;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        PILL_CLASSES[color],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}
