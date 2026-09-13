"use client";

import { useState, useTransition } from "react";
import { Bot } from "lucide-react";
import { toast } from "sonner";

import { saveTask } from "@/app/(app)/tarefas/actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * "Pedir ao Agente" — atalho pro mesmo mecanismo de sempre (task pending,
 * sem responsável humano vira candidata pro worker automático pegar), só
 * que com um form mínimo (sem cliente/prazo/assignee) pra deixar claro que
 * é um pedido em linguagem natural pro agente resolver, não uma task de
 * time normal. A rotina cloud roda a cada 2h (ver memória do projeto).
 */
export function AgentRequestDialog({
  open,
  onOpenChange,
  fallbackStatus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fallbackStatus: string;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, start] = useTransition();

  function reset() {
    setTitle("");
    setDescription("");
  }

  function submit() {
    if (!title.trim()) {
      toast.error("Descreva em uma frase o que você quer pedir.");
      return;
    }
    start(async () => {
      try {
        await saveTask({
          title: title.trim(),
          description: description.trim() || undefined,
          status: fallbackStatus,
          priority: "medium",
          assignees: [],
          subtasks: [],
        });
        toast.success(
          "Pedido criado — o agente pega automaticamente na próxima rodada (a cada 2h).",
        );
        reset();
        onOpenChange(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou ao criar o pedido.");
      }
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <SheetContent side="right" className="w-full p-0 sm:max-w-[460px]">
        <SheetHeader className="border-line border-b p-5">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold">
            <Bot className="size-4 text-[#45f0d1]" />
            Pedir ao Agente
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-5">
          <p className="text-ink-muted text-xs">
            Descreva em linguagem natural o que você quer que o agente faça.
            Vira uma tarefa pendente sem responsável — o worker automático
            pega sozinho na próxima rodada (a cada 2h) e documenta o
            resultado aqui mesmo, na tarefa.
          </p>

          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              O que você quer pedir? *
            </span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Corrigir o filtro de status que não limpa"
              className="border-line-strong focus:border-data mt-1 h-9 w-full rounded-md border bg-transparent px-2.5 text-sm outline-none"
            />
          </label>

          <label className="block">
            <span className="text-ink-muted text-[11px] font-semibold uppercase">
              Detalhes (opcional)
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              placeholder="Contexto, onde reproduzir, o que já foi tentado..."
              className="border-line-strong focus:border-data mt-1 w-full resize-none rounded-md border bg-transparent p-2.5 text-sm outline-none"
            />
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button size="sm" disabled={pending} onClick={submit}>
              <Bot className="size-4" />
              Enviar ao agente
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
