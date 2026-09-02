import { LogOut } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfile, getUser } from "@/lib/supabase/auth";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function Sidebar() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  const nome = profile?.full_name?.trim() || user?.email?.split("@")[0] || "Conta";
  const email = user?.email ?? "";

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
          {profile?.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={nome} />
          )}
          <AvatarFallback className="bg-[#45f0d1]/15 text-xs font-semibold text-[#45f0d1]">
            {initials(nome)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-sidebar-accent-foreground truncate text-sm font-medium">
            {nome}
          </div>
          <div className="text-muted-foreground truncate text-[11px]">
            {email}
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            title="Sair"
            className="text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent grid size-8 shrink-0 place-items-center rounded-lg transition-colors"
          >
            <LogOut className="size-4" />
            <span className="sr-only">Sair</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
