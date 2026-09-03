import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TEAM_BY_ID } from "@/lib/mock-data";

export function PersonCell({ responsavelId }: { responsavelId: string }) {
  const person = TEAM_BY_ID[responsavelId];
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-6">
        <AvatarFallback
          className="text-[10px] font-semibold"
          style={
            person
              ? { backgroundColor: `${person.cor}22`, color: person.cor }
              : {
                  backgroundColor:
                    "color-mix(in oklab, var(--ink-muted) 14%, transparent)",
                  color: "var(--ink-muted)",
                }
          }
        >
          {person?.iniciais ?? "--"}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm">{person?.nome ?? "Sem responsável"}</span>
    </div>
  );
}
