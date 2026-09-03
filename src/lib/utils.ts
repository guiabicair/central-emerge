import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
})

export function formatCurrency(valor: number) {
  return BRL.format(valor)
}

/** "12k", "1.4M" para caber nos cards e nos nos do canvas. */
export function formatCompactCurrency(valor: number) {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)}M`
  if (valor >= 1_000) return `R$ ${Math.round(valor / 1_000)}k`
  return BRL.format(valor)
}

export function initials(nome: string) {
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export function formatDate(iso: string) {
  return DATE_FMT.format(new Date(iso))
}

export function relativeDate(iso: string) {
  const then = new Date(iso).getTime()
  const days = Math.round((Date.now() - then) / 86_400_000)
  if (days <= 0) return "hoje"
  if (days === 1) return "ontem"
  if (days < 7) return `${days}d atrás`
  if (days < 30) return `${Math.round(days / 7)}sem atrás`
  return `${Math.round(days / 30)}m atrás`
}

/**
 * Mensagem de erro amigável para toasts de Server Actions.
 * Falhas de rede/transporte viram algo acionável em vez de "Load failed".
 */
export function actionError(err: unknown, fallback = "Não foi possível concluir.") {
  const raw = err instanceof Error ? err.message : String(err ?? "")
  if (/load failed|failed to fetch|fetch failed|networkerror|timed? out|connection/i.test(raw)) {
    return "Falha de conexão. Verifique a internet e tente de novo."
  }
  return raw || fallback
}

/** Rotulo de prazo relativo (aceita datas futuras), para tarefas. */
export function dueLabel(iso: string) {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (days === 0) return "vence hoje"
  if (days === 1) return "vence amanhã"
  if (days > 1) return `em ${days}d`
  if (days === -1) return "1d de atraso"
  return `${Math.abs(days)}d de atraso`
}
