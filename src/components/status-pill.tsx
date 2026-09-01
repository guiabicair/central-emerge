import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PillColor =
  | "aqua"
  | "lime"
  | "green"
  | "violet"
  | "blue"
  | "amber"
  | "rose"
  | "slate";

export const PILL_HEX: Record<PillColor, string> = {
  aqua: "#45f0d1",
  lime: "#c9ff3f",
  green: "#34d399",
  violet: "#c98bff",
  blue: "#7c9cff",
  amber: "#fbbf24",
  rose: "#f87171",
  slate: "#8b918f",
};

const PILL_CLASSES: Record<PillColor, string> = {
  aqua: "bg-[#45f0d1]/12 text-[#45f0d1] border-[#45f0d1]/25",
  lime: "bg-[#c9ff3f]/12 text-[#c9ff3f] border-[#c9ff3f]/25",
  green: "bg-[#34d399]/12 text-[#34d399] border-[#34d399]/25",
  violet: "bg-[#c98bff]/12 text-[#c98bff] border-[#c98bff]/25",
  blue: "bg-[#7c9cff]/12 text-[#7c9cff] border-[#7c9cff]/25",
  amber: "bg-[#fbbf24]/12 text-[#fbbf24] border-[#fbbf24]/25",
  rose: "bg-[#f87171]/12 text-[#f87171] border-[#f87171]/25",
  slate: "bg-white/8 text-muted-foreground border-white/15",
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
      <span
        className="size-1.5 rounded-full bg-current"
        aria-hidden
      />
      {children}
    </span>
  );
}
