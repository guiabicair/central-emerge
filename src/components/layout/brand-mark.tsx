import { cn } from "@/lib/utils";

/**
 * `tone="sidebar"` para uso dentro do chrome sempre-escuro (sidebar / sheet);
 * padrão segue o tema (--ink) para telas públicas como o login.
 */
export function BrandMark({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "sidebar";
}) {
  const title =
    tone === "sidebar" ? "text-sidebar-accent-foreground" : "text-ink";
  const sub =
    tone === "sidebar" ? "text-sidebar-foreground/60" : "text-ink-muted";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="from-data to-action text-on-data grid size-8 place-items-center rounded-lg bg-gradient-to-br text-[13px] font-bold">
        CE
      </div>
      <div className="leading-tight">
        <div className={cn("text-sm font-semibold", title)}>Central Emerge</div>
        <div className={cn("text-[11px]", sub)}>Hub interno</div>
      </div>
    </div>
  );
}
