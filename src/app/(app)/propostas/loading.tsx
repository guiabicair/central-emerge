import { Topbar } from "@/components/layout/topbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <Topbar title="Propostas" description="Carregando…" />
      <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </>
  );
}
