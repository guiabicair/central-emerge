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

export function relativeDate(iso: string) {
  const then = new Date(iso).getTime()
  const days = Math.round((Date.now() - then) / 86_400_000)
  if (days <= 0) return "hoje"
  if (days === 1) return "ontem"
  if (days < 7) return `${days}d atrás`
  if (days < 30) return `${Math.round(days / 7)}sem atrás`
  return `${Math.round(days / 30)}m atrás`
}
