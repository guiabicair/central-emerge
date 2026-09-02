"use client";

import { ChevronDown, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PROJECTS, TEAM } from "@/lib/mock-data";
import type { TaskFilters } from "@/lib/tasks";
import { cn } from "@/lib/utils";

function QuickToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors",
        active
          ? "border-brand/50 bg-brand/10 text-brand"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function TaskFiltersBar({
  filters,
  onChange,
  atrasadasCount,
  onReset,
  hasActive,
}: {
  filters: TaskFilters;
  onChange: (patch: Partial<TaskFilters>) => void;
  atrasadasCount: number;
  onReset: () => void;
  hasActive: boolean;
}) {
  const toggleResponsavel = (id: string) => {
    const next = filters.responsaveis.includes(id)
      ? filters.responsaveis.filter((r) => r !== id)
      : [...filters.responsaveis, id];
    onChange({ responsaveis: next });
  };

  const toggleProjeto = (id: string) => {
    const next = filters.projetos.includes(id)
      ? filters.projetos.filter((p) => p !== id)
      : [...filters.projetos, id];
    onChange({ projetos: next });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 md:px-6">
      <div className="border-input bg-muted/40 flex h-8 w-full max-w-56 items-center gap-2 rounded-lg border px-2.5">
        <Search className="text-muted-foreground size-3.5" />
        <input
          value={filters.busca}
          onChange={(e) => onChange({ busca: e.target.value })}
          placeholder="Buscar tarefa…"
          className="placeholder:text-muted-foreground h-full w-full bg-transparent text-xs outline-none"
        />
      </div>

      <QuickToggle
        active={filters.minhas}
        onClick={() => onChange({ minhas: !filters.minhas })}
      >
        Minhas
      </QuickToggle>
      <QuickToggle
        active={filters.atrasadas}
        onClick={() => onChange({ atrasadas: !filters.atrasadas })}
      >
        Atrasadas
        <span className="ml-1 rounded-full bg-[#f87171]/20 px-1 text-[10px] text-[#f87171]">
          {atrasadasCount}
        </span>
      </QuickToggle>
      <QuickToggle
        active={filters.hoje}
        onClick={() => onChange({ hoje: !filters.hoje })}
      >
        Hoje
      </QuickToggle>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="h-8">
              Responsável
              {filters.responsaveis.length > 0 && (
                <span className="bg-brand/15 text-brand ml-1 rounded-full px-1 text-[10px]">
                  {filters.responsaveis.length}
                </span>
              )}
              <ChevronDown className="size-3.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel>Filtrar por responsável</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {TEAM.map((member) => (
            <DropdownMenuCheckboxItem
              key={member.id}
              checked={filters.responsaveis.includes(member.id)}
              onCheckedChange={() => toggleResponsavel(member.id)}
            >
              {member.nome}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="h-8">
              Projeto
              {filters.projetos.length > 0 && (
                <span className="bg-brand/15 text-brand ml-1 rounded-full px-1 text-[10px]">
                  {filters.projetos.length}
                </span>
              )}
              <ChevronDown className="size-3.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Filtrar por projeto</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PROJECTS.map((project) => (
            <DropdownMenuCheckboxItem
              key={project.id}
              checked={filters.projetos.includes(project.id)}
              onCheckedChange={() => toggleProjeto(project.id)}
            >
              {project.nome}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={onReset}
        >
          <X className="size-3.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}
