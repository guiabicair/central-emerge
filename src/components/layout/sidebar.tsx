import { BrandMark } from "@/components/layout/brand-mark";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Sidebar() {
  return (
    <aside className="bg-sidebar border-sidebar-border hidden w-64 shrink-0 flex-col border-r py-5 md:flex">
      <div className="px-5">
        <BrandMark />
      </div>

      <div className="mt-7 flex-1 overflow-y-auto">
        <p className="text-muted-foreground px-6 pb-2 text-[11px] font-medium tracking-wide uppercase">
          Navegação
        </p>
        <SidebarNav />
      </div>

      <div className="border-sidebar-border mx-3 mt-4 flex items-center gap-3 border-t px-3 pt-4">
        <Avatar className="size-8">
          <AvatarFallback className="bg-[#45f0d1]/15 text-xs font-semibold text-[#45f0d1]">
            EM
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 leading-tight">
          <div className="text-sidebar-accent-foreground truncate text-sm font-medium">
            Equipe Emerge
          </div>
          <div className="text-muted-foreground truncate text-[11px]">
            contato.emergetech@gmail.com
          </div>
        </div>
      </div>
    </aside>
  );
}
