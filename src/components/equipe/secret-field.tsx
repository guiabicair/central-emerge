"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";

export function SecretField({ value, label }: { value: string; label?: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!value) return <span className="text-muted-foreground text-xs">—</span>;

  return (
    <span className="inline-flex items-center gap-1.5">
      {label && <span className="text-muted-foreground text-xs">{label}</span>}
      <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
        {shown ? value : "•".repeat(Math.min(value.length, 10))}
      </code>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="text-muted-foreground hover:text-foreground"
        aria-label={shown ? "Ocultar" : "Mostrar"}
      >
        {shown ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          });
        }}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Copiar"
      >
        {copied ? (
          <Check className="size-3.5 text-[#34d399]" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </span>
  );
}
