import { Construction } from "lucide-react";

export function ComingSoon({ area }: { area: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="border-border bg-card/50 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
        <div className="bg-brand/10 text-brand grid size-12 place-items-center rounded-xl">
          <Construction className="size-6" />
        </div>
        <h2 className="text-lg font-semibold">{area}</h2>
        <p className="text-muted-foreground text-sm">
          Este módulo faz parte da Central Emerge, mas ainda não foi construído.
          A Fase 1 entrega o Pipeline de vendas — os demais chegam nas próximas
          fases.
        </p>
      </div>
    </div>
  );
}
