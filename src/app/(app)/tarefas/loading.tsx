import { Topbar } from "@/components/layout/topbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <Topbar title="Tarefas" description="Carregando…" />
      <div className="flex flex-1 gap-4 overflow-x-auto p-4 md:p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-[280px] shrink-0 space-y-2.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ))}
      </div>
    </>
  );
}
