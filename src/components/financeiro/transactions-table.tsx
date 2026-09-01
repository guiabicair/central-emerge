import { StatusPill } from "@/components/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Transaction } from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export function TransactionsTable({
  transactions,
}: {
  transactions: Transaction[];
}) {
  return (
    <div className="border-border bg-card rounded-2xl border">
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold">Transações recentes</h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="pl-4">Descrição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="pr-4">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const entrada = tx.tipo === "entrada";
            return (
              <TableRow key={tx.id} className="border-border">
                <TableCell className="pl-4">
                  <div className="max-w-[36ch] truncate font-medium">
                    {tx.descricao}
                  </div>
                  <div className="text-muted-foreground text-xs">{tx.parte}</div>
                </TableCell>
                <TableCell>
                  <StatusPill color={entrada ? "green" : "rose"}>
                    {entrada ? "Entrada" : "Saída"}
                  </StatusPill>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold",
                    entrada ? "text-[#34d399]" : "text-[#f87171]",
                  )}
                >
                  {entrada ? "+" : "−"}
                  {formatCurrency(tx.valor)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(tx.data)}
                </TableCell>
                <TableCell className="pr-4">
                  <StatusPill color={tx.status === "pago" ? "green" : "amber"}>
                    {tx.status === "pago" ? "Pago" : "Pendente"}
                  </StatusPill>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
