import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** acento semântico opcional para o valor (deriva de token, sem hex) */
export type StatAccent = "data" | "action" | "done" | "wip" | "warn" | "gap" | "auto";

const ACCENT_TEXT: Record<StatAccent, string> = {
  data: "text-data-text",
  action: "text-action-text",
  done: "text-done",
  wip: "text-wip",
  warn: "text-warn",
  gap: "text-gap",
  auto: "text-auto",
};

export function StatTile({
  label,
  value,
  hint,
  accent,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: StatAccent;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-line bg-surface rounded-xl border px-4 py-3",
        className,
      )}
    >
      <div className="text-ink-muted text-[11px]">{label}</div>
      <div
        className={cn(
          "mt-1 text-lg font-semibold",
          accent ? ACCENT_TEXT[accent] : "text-ink",
        )}
      >
        {value}
      </div>
      {hint != null && (
        <div className="text-ink-muted text-[11px]">{hint}</div>
      )}
    </div>
  );
}
