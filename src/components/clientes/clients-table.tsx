import { StatusPill, type PillColor } from "@/components/status-pill";
import { PersonCell } from "@/components/person-cell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Client, ClientStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_META: Record<ClientStatus, { label: string; color: PillColor }> = {
  ativo: { label: "Ativo", color: "green" },
  pausado: { label: "Pausado", color: "amber" },
  encerrado: { label: "Encerrado", color: "slate" },
};

export function ClientsTable({ clients }: { clients: Client[] }) {
  const ativos = clients.filter((c) => c.status === "ativo");
  const mrrAtivo = ativos.reduce((s, c) => s + c.valorContrato, 0);

  return (
    <div className="border-border bg-card rounded-2xl border">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <h2 className="text-sm font-semibold">
          Clientes{" "}
          <span className="text-muted-foreground font-normal">
            · {clients.length} no total
          </span>
        </h2>
        <span className="text-muted-foreground text-xs">
          {ativos.length} ativos · {formatCurrency(mrrAtivo)} em contratos
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="pl-4">Cliente</TableHead>
            <TableHead>Segmento</TableHead>
            <TableHead className="text-right">Valor do contrato</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4">Fechado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const meta = STATUS_META[client.status];
            return (
              <TableRow key={client.id} className="border-border">
                <TableCell className="pl-4">
                  <div className="font-medium">{client.nome}</div>
                  <div className="text-muted-foreground text-xs">
                    {client.empresa}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.segmento}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(client.valorContrato)}
                </TableCell>
                <TableCell>
                  <PersonCell responsavelId={client.responsavelId} />
                </TableCell>
                <TableCell>
                  <StatusPill color={meta.color}>{meta.label}</StatusPill>
                </TableCell>
                <TableCell className="text-muted-foreground pr-4">
                  {formatDate(client.fechadoEm)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
