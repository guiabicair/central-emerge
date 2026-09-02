import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

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
  /** hex opcional para colorir o valor */
  accent?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-card rounded-xl border px-4 py-3",
        className,
      )}
    >
      <div className="text-muted-foreground text-[11px]">{label}</div>
      <div
        className="mt-1 text-lg font-semibold"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      {hint != null && (
        <div className="text-muted-foreground text-[11px]">{hint}</div>
      )}
    </div>
  );
}
