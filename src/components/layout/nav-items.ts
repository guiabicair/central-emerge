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
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, ready: true },
  { href: "/pipeline", label: "Pipeline", icon: Workflow, ready: true },
  { href: "/propostas", label: "Propostas", icon: FileText, ready: true },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, ready: true },
  { href: "/tarefas", label: "Tarefas", icon: ListChecks, ready: true },
  { href: "/clientes", label: "Clientes", icon: Users, ready: true },
  { href: "/calendario", label: "Calendário", icon: CalendarDays, ready: true },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];
