import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#45f0d1] to-[#c9ff3f] text-[13px] font-bold text-[#04231d]">
        CE
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-sidebar-accent-foreground">
          Central Emerge
        </div>
        <div className="text-[11px] text-muted-foreground">Hub interno</div>
      </div>
    </div>
  );
}
