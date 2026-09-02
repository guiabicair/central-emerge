import { ExternalLink, Receipt } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PROPOSAL_STATUS_META, sortProposals } from "@/lib/proposals";
import type { Proposal } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export function ProposalsTable({ proposals }: { proposals: Proposal[] }) {
  const rows = sortProposals(proposals);

  return (
    <div className="border-border bg-card rounded-2xl border">
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold">
          Propostas{" "}
          <span className="text-muted-foreground font-normal">
            · {proposals.length} no total
          </span>
        </h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="pl-4">Cliente / proposta</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criada</TableHead>
            <TableHead>Enviada</TableHead>
            <TableHead className="pr-4 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => {
            const meta = PROPOSAL_STATUS_META[p.status];
            return (
              <TableRow key={p.id} className="border-border">
                <TableCell className="pl-4">
                  <div className="font-medium">{p.empresa}</div>
                  <div className="text-muted-foreground text-xs">{p.titulo}</div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(p.valor)}
                </TableCell>
                <TableCell>
                  <StatusPill color={meta.color}>{meta.label}</StatusPill>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(p.criadaEm)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.enviadaEm ? formatDate(p.enviadaEm) : "—"}
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex items-center justify-end gap-2">
                    {p.linkPagamentoAsaas && (
                      <a
                        href={p.linkPagamentoAsaas}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
                        title="Cobrança no Asaas"
                      >
                        <Receipt className="size-3.5" />
                        Cobrança
                      </a>
                    )}
                    <a
                      href={p.linkPublico}
                      target="_blank"
                      rel="noreferrer"
                      className="border-border hover:border-brand/40 hover:text-foreground text-muted-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"
                    >
                      Ver proposta
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
