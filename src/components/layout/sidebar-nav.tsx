"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <span
              className={cn(
                "bg-data absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon
              className={cn(
                "size-4 shrink-0",
                active ? "text-data" : "text-current",
              )}
            />
            <span className="flex-1 truncate">{item.label}</span>
            {!item.ready && (
              <span className="border-sidebar-border text-sidebar-foreground/60 rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
                em breve
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
