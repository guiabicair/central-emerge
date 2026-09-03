import { Topbar } from "@/components/layout/topbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <Topbar title="Financeiro" description="Carregando…" />
      <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[320px] rounded-2xl" />
      </div>
    </>
  );
}
