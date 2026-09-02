"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CLIENTS, TEAM } from "@/lib/mock-data";
import type { DependencyResponsavel, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DependencyForm({
  blocker,
  blocked,
  onCancel,
  onConfirm,
}: {
  blocker?: Task;
  blocked?: Task;
  onCancel: () => void;
  onConfirm: (motivo: string, responsavel: DependencyResponsavel) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [tipo, setTipo] = useState<"equipe" | "cliente">("equipe");
  const [equipeId, setEquipeId] = useState(TEAM[0]?.id ?? "");
  const [clienteId, setClienteId] = useState(CLIENTS[0]?.id ?? "");

  const submit = () => {
    const m = motivo.trim();
    if (!m) return;
    onConfirm(m, {
      tipo,
      id: tipo === "equipe" ? equipeId : clienteId,
    });
  };

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="border-border w-full max-w-sm rounded-xl border bg-[#0f1112] p-4 text-[#eef1f0] shadow-xl">
        <h3 className="text-sm font-semibold">Nova dependência</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          <span className="text-foreground">
            {blocker?.titulo ?? "—"}
          </span>{" "}
          passa a bloquear{" "}
          <span className="text-foreground">{blocked?.titulo ?? "—"}</span>.
        </p>

        <label className="mt-3 block text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
          Motivo
        </label>
        <input
          autoFocus
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onCancel();
          }}
          placeholder="Ex: Aguardando aprovação do cliente"
          className="border-input mt-1 h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none"
        />

        <label className="mt-3 block text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
          Responsável por destravar
        </label>
        <div className="mt-1 flex gap-1.5">
          {(["equipe", "cliente"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={cn(
                "h-8 flex-1 rounded-md border text-xs font-medium capitalize transition-colors",
                tipo === t
                  ? "border-brand/50 bg-brand/10 text-brand"
                  : "border-border text-muted-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tipo === "equipe" ? (
          <select
            value={equipeId}
            onChange={(e) => setEquipeId(e.target.value)}
            className="border-input mt-1.5 h-8 w-full rounded-md border bg-[#0f1112] px-2 text-sm outline-none"
          >
            {TEAM.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="border-input mt-1.5 h-8 w-full rounded-md border bg-[#0f1112] px-2 text-sm outline-none"
          >
            {CLIENTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.empresa}
              </option>
            ))}
          </select>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button size="sm" disabled={!motivo.trim()} onClick={submit}>
            Confirmar dependência
          </Button>
        </div>
      </div>
    </div>
  );
}
