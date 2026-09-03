import { ExternalLink } from "lucide-react";

import { StatTile } from "@/components/stat-tile";
import { StatusPill, type PillColor } from "@/components/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, relativeDate } from "@/lib/utils";

export interface ProposalRow {
  id: number;
  slug: string;
  cliente: string;
  exibicao: string;
  status: string;
  dataProposta: string;
  validaAte: string | null;
  valor: number | null;
  ultimaAbertura: string | null;
}

export interface TrafficRow {
  slug: string;
  pageviews: number;
  clicks: number;
  last: string;
}

const STATUS_META: Record<string, { label: string; color: PillColor }> = {
  rascunho: { label: "Rascunho", color: "slate" },
  enviada: { label: "Enviada", color: "blue" },
  aprovada: { label: "Aprovada", color: "green" },
  recusada: { label: "Recusada", color: "rose" },
  arquivada: { label: "Arquivada", color: "amber" },
};

const PUBLIC_BASE = "https://emerge-propostas.vercel.app";

export function ProposalsList({
  proposals,
  traffic,
  loadError,
}: {
  proposals: ProposalRow[];
  traffic: TrafficRow[];
  loadError: string | null;
}) {
  if (loadError) {
    return (
      <div className="border-line bg-surface rounded-2xl border p-6 text-sm">
        <p className="font-medium">Não foi possível carregar as propostas.</p>
        <p className="text-ink-muted mt-1">
          Rode a migration <code>0008</code> (bridge de RLS de{" "}
          <code>propostas</code> / <code>propostas_events</code>). Detalhe:{" "}
          {loadError}
        </p>
      </div>
    );
  }

  const enviadas = proposals.filter((p) =>
    ["enviada", "aprovada", "recusada", "arquivada"].includes(p.status),
  ).length;
  const aprovadas = proposals.filter((p) => p.status === "aprovada").length;
  const emAberto = proposals
    .filter((p) => p.status === "enviada")
    .reduce((s, p) => s + (p.valor ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Propostas" value={proposals.length} />
        <StatTile label="Enviadas" value={enviadas} />
        <StatTile label="Aprovadas" value={aprovadas} accent="done" />
        <StatTile
          label="Valor em aberto"
          value={emAberto > 0 ? formatCurrency(emAberto) : "—"}
          hint="status enviada"
          accent="data"
        />
      </div>

      <div className="border-line bg-surface rounded-2xl border">
        <div className="flex items-baseline justify-between px-4 py-3">
          <h2 className="text-sm font-semibold">
            Propostas{" "}
            <span className="text-ink-muted font-normal">
              · leitura (o gerador é o dono da escrita)
            </span>
          </h2>
          <a
            href={`${PUBLIC_BASE}/admin`}
            target="_blank"
            rel="noreferrer"
            className="text-ink-muted hover:text-ink inline-flex items-center gap-1 text-xs"
          >
            Abrir gerador
            <ExternalLink className="size-3.5" />
          </a>
        </div>

        {proposals.length === 0 ? (
          <div className="px-4 pb-6 pt-2">
            <p className="text-sm font-medium">
              Nenhuma proposta registrada em <code>propostas</code> ainda.
            </p>
            <p className="text-ink-muted mt-1 text-sm">
              O gerador (emerge-propostas.vercel.app) ainda não grava nesta
              tabela. Quando gravar, elas aparecem aqui automaticamente.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="pl-4">Proposta</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada</TableHead>
                <TableHead>Válida até</TableHead>
                <TableHead className="pr-4 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((p) => {
                const meta = STATUS_META[p.status] ?? {
                  label: p.status,
                  color: "slate" as PillColor,
                };
                return (
                  <TableRow key={p.id} className="border-line">
                    <TableCell className="pl-4">
                      <div className="font-medium">{p.exibicao}</div>
                      <div className="text-ink-muted text-xs">
                        {p.cliente}
                        {p.ultimaAbertura
                          ? ` · abriu ${relativeDate(p.ultimaAbertura)}`
                          : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {p.valor != null ? formatCurrency(p.valor) : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusPill color={meta.color}>{meta.label}</StatusPill>
                    </TableCell>
                    <TableCell className="text-ink-muted">
                      {formatDate(p.dataProposta)}
                    </TableCell>
                    <TableCell className="text-ink-muted">
                      {p.validaAte ? formatDate(p.validaAte) : "—"}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <a
                        href={`${PUBLIC_BASE}/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="border-line hover:border-data/40 hover:text-ink text-ink-muted inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"
                      >
                        Ver página
                        <ExternalLink className="size-3.5" />
                      </a>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {traffic.length > 0 && (
        <div className="border-line bg-surface rounded-2xl border">
          <div className="px-4 py-3">
            <h2 className="text-sm font-semibold">
              Páginas com tráfego{" "}
              <span className="text-ink-muted font-normal">
                · propostas_events (sem registro em <code>propostas</code>)
              </span>
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="pl-4">Slug</TableHead>
                <TableHead className="text-right">Pageviews</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead>Última atividade</TableHead>
                <TableHead className="pr-4 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {traffic.map((t) => (
                <TableRow key={t.slug} className="border-line">
                  <TableCell className="pl-4 font-medium">{t.slug}</TableCell>
                  <TableCell className="text-right">{t.pageviews}</TableCell>
                  <TableCell className="text-right">{t.clicks}</TableCell>
                  <TableCell className="text-ink-muted">
                    {formatDate(t.last)} · {relativeDate(t.last)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <a
                      href={`${PUBLIC_BASE}/${t.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="border-line hover:border-data/40 hover:text-ink text-ink-muted inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"
                    >
                      Ver página
                      <ExternalLink className="size-3.5" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
