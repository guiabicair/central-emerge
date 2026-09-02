import type { ReactNode } from "react";

export function SectionCard({
  title,
  summary,
  children,
}: {
  title: string;
  summary?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="border-border bg-card rounded-2xl border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {summary != null && (
          <span className="text-muted-foreground text-xs">{summary}</span>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
