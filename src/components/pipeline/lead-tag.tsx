import { TAG_COLOR_CLASSES } from "@/lib/pipeline";
import type { LeadTag } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LeadTagPill({ tag, className }: { tag: LeadTag; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        TAG_COLOR_CLASSES[tag.color],
        className,
      )}
    >
      {tag.label}
    </span>
  );
}
