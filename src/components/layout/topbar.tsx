"use client";

import { useState } from "react";
import { Bell, Menu, Search } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface TopbarProps {
  title: string;
  description?: string;
}

export function Topbar({ title, description }: TopbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-border bg-background/80 sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          }
        />
        <SheetContent side="left" className="bg-sidebar w-72 p-0">
          <SheetHeader className="p-5">
            <SheetTitle className="text-left">
              <BrandMark />
            </SheetTitle>
          </SheetHeader>
          <div className="pb-6">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold">{title}</h1>
        {description && (
          <p className="text-muted-foreground truncate text-xs">{description}</p>
        )}
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <div className="border-input bg-muted/40 text-muted-foreground flex h-9 w-56 items-center gap-2 rounded-lg border px-3 text-sm">
          <Search className="size-4" />
          <span>Buscar…</span>
        </div>
      </div>
      <Button variant="ghost" size="icon">
        <Bell className="size-4" />
        <span className="sr-only">Notificações</span>
      </Button>
    </header>
  );
}
