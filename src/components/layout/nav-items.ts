import {
  CalendarDays,
  FileText,
  LayoutDashboard,
  ListChecks,
  Settings,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Fase 1: so o Pipeline tem conteudo real */
  ready?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Workflow, ready: true },
  { href: "/propostas", label: "Propostas", icon: FileText },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/tarefas", label: "Tarefas", icon: ListChecks },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];
