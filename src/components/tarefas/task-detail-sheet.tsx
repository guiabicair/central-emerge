"use client";

import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  CheckCircle2,
  Code,
  FolderOpen,
  Link as LinkIcon,
  Paperclip,
  Pencil,
  PenTool,
  Plus,
  Trash2,
  Video,
} from "lucide-react";

import { PersonCell } from "@/components/person-cell";
import { StatusPill } from "@/components/status-pill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CLIENTS_BY_ID, TEAM, TEAM_BY_ID } from "@/lib/mock-data";
import {
  PRIORITY_META,
  nextColumn,
  subtaskProgress,
  totalHoras,
} from "@/lib/tasks";
import type { Task, TaskColumn } from "@/lib/types";
import { cn, formatDate, relativeDate } from "@/lib/utils";

interface Props {
  task: Task | null;
  columns: TaskColumn[];
  allTasks: Task[];
  onOpenChange: (open: boolean) => void;
  onNavigateTask: (id: string) => void;
  onRename: (id: string, titulo: string) => void;
  onEntregar: (id: string) => void;
  onToggleSubtask: (id: string, subId: string) => void;
  onAddSubtask: (id: string, label: string) => void;
  onAddComment: (id: string, texto: string) => void;
  onReassign: (id: string, pessoaId: string) => void;
  onDelete: (id: string) => void;
}

function refIcon(url: string) {
  const u = url.toLowerCase();
  if (u.includes("figma")) return PenTool;
  if (u.includes("youtube") || u.includes("youtu.be")) return Video;
  if (u.includes("github")) return Code;
  if (u.includes("drive.google") || u.includes("docs.google")) return FolderOpen;
  return LinkIcon;
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TaskDetailSheet(props: Props) {
  const { task, columns, allTasks } = props;
  const [editing, setEditing] = useState(false);
  const [tituloDraft, setTituloDraft] = useState("");
  const [novaSub, setNovaSub] = useState("");
  const [novoComentario, setNovoComentario] = useState("");

  useEffect(() => {
    setEditing(false);
    setTituloDraft(task?.titulo ?? "");
    setNovaSub("");
    setNovoComentario("");
  }, [task?.id, task?.titulo]);

  if (!task) {
    return <Sheet open={false} onOpenChange={props.onOpenChange} />;
  }

  const cliente = task.clienteId ? CLIENTS_BY_ID[task.clienteId] : undefined;
  const coluna = columns.find((c) => c.id === task.status) ?? columns[0];
  const proxima = nextColumn(columns, task.status);
  const priority = PRIORITY_META[task.prioridade];
  const sub = subtaskProgress(task);
  const registrado = totalHoras(task);
  const estimado = task.horasEstimadas ?? 0;
  const bloqueadaPor = task.dependsOn
    .map((id) => allTasks.find((t) => t.id === id))
    .filter((t): t is Task => Boolean(t));
  const bloqueia = allTasks.filter((t) => t.dependsOn.includes(task.id));

  const saveTitulo = () => {
    const v = tituloDraft.trim();
    if (v && v !== task.titulo) props.onRename(task.id, v);
    setEditing(false);
  };

  return (
    <Sheet open onOpenChange={props.onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[460px]">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-border border-b p-5 pr-12">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={tituloDraft}
                  onChange={(e) => setTituloDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitulo();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  className="border-input w-full rounded-md border bg-transparent px-2 py-1 text-base font-semibold outline-none"
                />
                <Button size="sm" onClick={saveTitulo}>
                  Salvar
                </Button>
              </div>
            ) : (
              <SheetTitle className="text-base leading-snug font-semibold">
                {task.titulo}
              </SheetTitle>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                style={{
                  color: coluna?.accent,
                  borderColor: `${coluna?.accent}44`,
                  backgroundColor: `${coluna?.accent}1a`,
                }}
              >
                {coluna?.label}
              </span>
              <StatusPill color={priority.color}>{priority.label}</StatusPill>
              <StatusPill color="slate">{task.categoria}</StatusPill>
            </div>

            <p className="text-muted-foreground mt-2 text-xs">
              Cliente:{" "}
              <span className="text-foreground">
                {cliente ? cliente.empresa : "Sem cliente"}
              </span>{" "}
              · Prazo {formatDate(task.prazo)}
            </p>
          </SheetHeader>

          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            <Section title="Briefing">
              <p className="text-sm whitespace-pre-line">{task.briefing}</p>
            </Section>

            <Section title="Referências">
              {task.referencias.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  Nenhuma referência.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {task.referencias.map((ref) => {
                    const Icon = refIcon(ref.url);
                    return (
                      <li key={ref.url}>
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noreferrer"
                          className="border-border hover:border-brand/40 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs"
                        >
                          <Icon className="text-muted-foreground size-3.5 shrink-0" />
                          <span className="truncate">{ref.label}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>

            <Section title="Pasta do Drive">
              {task.driveLink ? (
                <a
                  href={task.driveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="border-border hover:border-brand/40 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs"
                >
                  <FolderOpen className="size-4 text-[#45f0d1]" />
                  Abrir pasta no Google Drive
                </a>
              ) : (
                <div className="border-border flex items-center justify-between gap-2 rounded-lg border border-dashed px-2.5 py-2">
                  <span className="text-muted-foreground text-xs">
                    Sem pasta vinculada
                  </span>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button size="xs" variant="outline" disabled>
                          Conectar Google Drive
                        </Button>
                      }
                    />
                    <TooltipContent>Em breve — Fase 4</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </Section>

            <Section title="Dependências">
              {bloqueadaPor.length === 0 && bloqueia.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  Sem dependências.
                </p>
              ) : (
                <div className="space-y-2">
                  {bloqueadaPor.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-1 text-[11px]">
                        Bloqueada por
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {bloqueadaPor.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => props.onNavigateTask(t.id)}
                            className="border-border hover:border-brand/40 max-w-[220px] truncate rounded-full border px-2 py-0.5 text-[11px]"
                          >
                            {t.titulo}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {bloqueia.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-1 text-[11px]">
                        Bloqueia
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {bloqueia.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => props.onNavigateTask(t.id)}
                            className="border-border hover:border-brand/40 max-w-[220px] truncate rounded-full border px-2 py-0.5 text-[11px]"
                          >
                            {t.titulo}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Section>

            <Section
              title="Subtarefas"
              action={
                <span className="text-muted-foreground text-[11px]">
                  {sub.done} de {sub.total} concluídas
                </span>
              }
            >
              {sub.total > 0 && (
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-brand h-full rounded-full transition-all"
                    style={{
                      width: `${sub.total ? (sub.done / sub.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              )}
              <ul className="mt-2 space-y-1">
                {task.subtarefas.map((st) => (
                  <li key={st.id}>
                    <label className="hover:bg-muted/40 flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm">
                      <input
                        type="checkbox"
                        checked={st.concluida}
                        onChange={() =>
                          props.onToggleSubtask(task.id, st.id)
                        }
                        className="accent-[#45f0d1]"
                      />
                      <span
                        className={cn(
                          st.concluida && "text-muted-foreground line-through",
                        )}
                      >
                        {st.label}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <form
                className="mt-1.5 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = novaSub.trim();
                  if (v) {
                    props.onAddSubtask(task.id, v);
                    setNovaSub("");
                  }
                }}
              >
                <input
                  value={novaSub}
                  onChange={(e) => setNovaSub(e.target.value)}
                  placeholder="Nova subtarefa…"
                  className="border-input h-8 flex-1 rounded-md border bg-transparent px-2 text-xs outline-none"
                />
                <Button type="submit" size="xs" variant="outline">
                  <Plus className="size-3.5" />
                </Button>
              </form>
            </Section>

            <Section title="Tempo">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {registrado.toLocaleString("pt-BR", {
                    maximumFractionDigits: 1,
                  })}
                  h registradas
                  {estimado > 0 && ` de ${estimado}h estimadas`}
                </span>
                {estimado > 0 && (
                  <span
                    className={cn(
                      registrado > estimado
                        ? "text-[#f87171]"
                        : "text-muted-foreground",
                    )}
                  >
                    {Math.round((registrado / estimado) * 100)}%
                  </span>
                )}
              </div>
              {estimado > 0 && (
                <div className="bg-muted mt-1.5 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (registrado / estimado) * 100)}%`,
                      backgroundColor:
                        registrado > estimado ? "#f87171" : "#45f0d1",
                    }}
                  />
                </div>
              )}
            </Section>

            {task.meta && (
              <Section title="Meta vinculada">
                <div className="flex items-center justify-between text-xs">
                  <span>{task.meta.label}</span>
                  <span className="text-muted-foreground">
                    {task.meta.valorAtual}/{task.meta.valorAlvo}{" "}
                    {task.meta.unidade}
                  </span>
                </div>
                <div className="bg-muted mt-1.5 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-brand-lime h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (task.meta.valorAtual / task.meta.valorAlvo) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </Section>
            )}

            {task.aprovacao.status !== "pendente" && (
              <Section title="Aprovação">
                <div className="flex items-center gap-2">
                  <StatusPill
                    color={
                      task.aprovacao.status === "aprovada" ? "green" : "rose"
                    }
                  >
                    {task.aprovacao.status === "aprovada"
                      ? "Aprovada"
                      : "Devolvida"}
                  </StatusPill>
                  {task.aprovacao.por && (
                    <span className="text-muted-foreground text-[11px]">
                      por {TEAM_BY_ID[task.aprovacao.por]?.nome}
                    </span>
                  )}
                </div>
                {task.aprovacao.comentario && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    “{task.aprovacao.comentario}”
                  </p>
                )}
              </Section>
            )}

            <Section title="Comentários">
              <ul className="space-y-2.5">
                {task.comentarios.map((c, i) => {
                  const autor = TEAM_BY_ID[c.autorId];
                  return (
                    <li key={i} className="flex gap-2">
                      <Avatar className="size-6">
                        <AvatarFallback
                          className="text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${autor?.cor ?? "#8b918f"}22`,
                            color: autor?.cor ?? "#8b918f",
                          }}
                        >
                          {autor?.iniciais ?? "--"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium">
                            {autor?.nome ?? "—"}
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            {relativeDate(c.data)}
                          </span>
                        </div>
                        <p className="text-sm">{c.texto}</p>
                      </div>
                    </li>
                  );
                })}
                {task.comentarios.length === 0 && (
                  <li className="text-muted-foreground text-xs">
                    Nenhum comentário.
                  </li>
                )}
              </ul>
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = novoComentario.trim();
                  if (v) {
                    props.onAddComment(task.id, v);
                    setNovoComentario("");
                  }
                }}
              >
                <input
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Escrever comentário…"
                  className="border-input h-8 flex-1 rounded-md border bg-transparent px-2 text-xs outline-none"
                />
                <Button type="submit" size="sm">
                  Comentar
                </Button>
              </form>
            </Section>
          </div>

          <div className="border-border space-y-2 border-t p-4">
            <Button
              className="w-full bg-[#34d399] text-[#04231d] hover:bg-[#34d399]/90"
              disabled={!proxima}
              onClick={() => props.onEntregar(task.id)}
            >
              <CheckCircle2 className="size-4" />
              {proxima
                ? `Entregar Tarefa → ${proxima.label}`
                : "Na última coluna do fluxo"}
            </Button>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTituloDraft(task.titulo);
                  setEditing(true);
                }}
              >
                <Pencil className="size-3.5" />
                Editar
              </Button>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="outline" size="sm" disabled>
                      <Paperclip className="size-3.5" />
                      Anexos
                    </Button>
                  }
                />
                <TooltipContent>Em breve</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm">
                      <ArrowRightLeft className="size-3.5" />
                      Encaminhar para…
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Reatribuir tarefa</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {TEAM.map((member) => (
                    <DropdownMenuItem
                      key={member.id}
                      disabled={member.id === task.responsavelId}
                      onClick={() => props.onReassign(task.id, member.id)}
                    >
                      {member.nome}
                      {member.id === task.responsavelId && " (atual)"}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <div className="text-muted-foreground px-2 py-1 text-[10px]">
                    Protótipo — a notificação real ao membro é fase futura.
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => props.onDelete(task.id)}
              >
                <Trash2 className="size-3.5" />
                Deletar
              </Button>
            </div>

            <div className="text-muted-foreground pt-1 text-[11px]">
              Responsável atual:{" "}
              <span className="inline-flex translate-y-1 align-top">
                <PersonCell responsavelId={task.responsavelId} />
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
