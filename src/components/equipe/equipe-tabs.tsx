"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/equipe/pessoas", label: "Pessoas" },
  { href: "/equipe/papeis", label: "Papéis & permissões" },
];

export function EquipeTabs({ canManageRoles }: { canManageRoles: boolean }) {
  const pathname = usePathname();
  const tabs = TABS.filter(
    (t) => t.href !== "/equipe/papeis" || canManageRoles,
  );

  return (
    <div className="border-border flex gap-1 border-b px-4 md:px-6">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-brand text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
