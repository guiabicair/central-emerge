/** utilitarios de data para o Calendario (sem lib externa) */

export const WEEKDAY_LABELS = [
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
  "Dom",
] as const;

export function ymd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return ymd(a) === ymd(b);
}

export function monthLabel(d: Date): string {
  const s = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Matriz de semanas (segunda a domingo) cobrindo o mes inteiro. */
export function monthMatrix(month: Date): Date[][] {
  const first = startOfMonth(month);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const startOffset = (first.getDay() + 6) % 7; // dias ate a segunda anterior
  const endOffset = 6 - ((last.getDay() + 6) % 7); // dias ate o domingo seguinte
  const total = startOffset + last.getDate() + endOffset;

  const weeks: Date[][] = [];
  for (let i = 0; i < total; i++) {
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1]!.push(
      new Date(first.getFullYear(), first.getMonth(), 1 - startOffset + i),
    );
  }
  return weeks;
}
