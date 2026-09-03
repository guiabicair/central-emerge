import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { CronogramasSection } from "@/components/clientes/cronogramas-section";
import { StatusPill } from "@/components/status-pill";
import { can } from "@/lib/auth/roles";
import { listCronogramas } from "@/lib/cronogramas/queries";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Cliente · Central Emerge" };

const PUBLIC_GEN = "https://emerge-propostas.vercel.app";

const TASK_STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
  revisao: "Revisão",
};
const DELIVERY_LABEL: Record<string, string> = {
  submitted: "Aguardando revisão",
  approved: "Aprovada",
  changes_requested: "Ajustes pedidos",
};

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-line bg-surface rounded-2xl border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <span className="text-ink-muted text-xs">{hint}</span>}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-ink-muted py-4 text-center text-sm">{children}</p>;
}

export default async function ClienteHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await can("clientes.view"))) {
    return (
      <>
        <Topbar title="Cliente" />
        <div className="flex-1 p-6">
          <div className="border-line bg-surface rounded-2xl border p-6 text-sm">
            Você não tem acesso aos clientes.
          </div>
        </div>
      </>
    );
  }

  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from("clients")
    .select("id, name, segment, status, contact_name, email, phone, notes, mrr")
    .eq("id", id)
    .maybeSingle();

  if (error || !client) notFound();

  const canManage = await can("clientes.manage");
  const cronogramas = await listCronogramas(id);

  const [recRes, specRes, taskRes] = await Promise.all([
    supabase
      .from("recurring_projects")
      .select("id, title, monthly_amount, status, start_date, end_date")
      .eq("client_id", id)
      .order("start_date", { ascending: false }),
    supabase
      .from("specific_projects")
      .select("id, title, total_amount, paid_amount, status, payment_date")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date")
      .eq("client_id", id)
      .order("updated_at", { ascending: false }),
  ]);

  const recurring = recRes.data ?? [];
  const specific = specRes.data ?? [];
  const tasks = taskRes.data ?? [];

  const mrrRec = recurring
    .filter((r) => r.status === "active")
    .reduce((s, r) => s + (Number(r.monthly_amount) || 0), 0);
  const totalSpecific = specific.reduce(
    (s, r) => s + (Number(r.total_amount) || 0),
    0,
  );

  // roll-up de entregas das tarefas do cliente
  const taskIds = tasks.map((t) => t.id);
  const delRes = taskIds.length
    ? await supabase
        .from("task_deliveries")
        .select("id, task_id, status, description, drive_folder_url, submitted_at")
        .in("task_id", taskIds)
        .order("submitted_at", { ascending: false })
    : { data: [] as never[] };
  const deliveries = delRes.data ?? [];
  const titleByTask = new Map(tasks.map((t) => [t.id, t.title]));

  const tasksByStatus = new Map<string, number>();
  for (const t of tasks)
    tasksByStatus.set(t.status, (tasksByStatus.get(t.status) ?? 0) + 1);

  return (
    <>
      <Topbar title={client.name} description={client.segment ?? "Cliente"} />
      <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
        <Link
          href="/clientes"
          className="text-ink-muted hover:text-ink inline-flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="size-3.5" />
          Todos os clientes
        </Link>

        {/* cabeçalho */}
        <div className="border-line bg-surface rounded-2xl border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold">{client.name}</h1>
              <p className="text-ink-muted mt-0.5 text-sm">
                {client.segment ?? "—"}
                {client.contact_name ? ` · ${client.contact_name}` : ""}
                {client.email ? ` · ${client.email}` : ""}
                {client.phone ? ` · ${client.phone}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill color={client.status === "inactive" ? "slate" : "green"}>
                {client.status === "inactive" ? "Inativo" : "Ativo"}
              </StatusPill>
              <div className="text-right">
                <div className="text-lg font-semibold">
                  {formatCurrency(mrrRec)}
                </div>
                <div className="text-ink-muted text-[11px]">MRR recorrente</div>
              </div>
            </div>
          </div>
          {client.notes && (
            <p className="text-ink-muted border-line mt-3 border-t pt-3 text-sm">
              {client.notes}
            </p>
          )}
        </div>

        {/* financeiro do cliente */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border-line bg-surface rounded-xl border p-4">
            <div className="text-ink-muted text-[11px]">MRR recorrente</div>
            <div className="mt-1 text-xl font-semibold">
              {formatCurrency(mrrRec)}
            </div>
            <div className="text-ink-muted text-[11px]">
              {recurring.filter((r) => r.status === "active").length} contrato(s)
              ativo(s)
            </div>
          </div>
          <div className="border-line bg-surface rounded-xl border p-4">
            <div className="text-ink-muted text-[11px]">
              Projetos pontuais (total)
            </div>
            <div className="mt-1 text-xl font-semibold">
              {formatCurrency(totalSpecific)}
            </div>
            <div className="text-ink-muted text-[11px]">
              {specific.length} projeto(s)
            </div>
          </div>
          <div className="border-line bg-surface rounded-xl border p-4">
            <div className="text-ink-muted text-[11px]">Tarefas</div>
            <div className="mt-1 text-xl font-semibold">{tasks.length}</div>
            <div className="text-ink-muted text-[11px]">
              {tasks.filter((t) => t.status === "completed").length} concluídas
            </div>
          </div>
        </div>

        {/* projetos */}
        <Section
          title="Projetos"
          hint={`${recurring.length} recorrentes · ${specific.length} pontuais`}
        >
          {recurring.length === 0 && specific.length === 0 ? (
            <Empty>Nenhum projeto cadastrado pra este cliente.</Empty>
          ) : (
            <div className="space-y-2">
              {recurring.map((r) => (
                <div
                  key={r.id}
                  className="border-line flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="text-sm font-medium">{r.title}</div>
                    <div className="text-ink-muted text-xs">
                      Recorrente · desde {formatDate(r.start_date)}
                      {r.status !== "active" ? ` · ${r.status}` : ""}
                    </div>
                  </div>
                  <span className="text-data-text text-sm font-semibold">
                    {formatCurrency(Number(r.monthly_amount) || 0)}/mês
                  </span>
                </div>
              ))}
              {specific.map((s) => (
                <div
                  key={s.id}
                  className="border-line flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="text-ink-muted text-xs">
                      Pontual · {s.status}
                      {s.payment_date ? ` · pago ${formatDate(s.payment_date)}` : ""}
                    </div>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatCurrency(Number(s.total_amount) || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <CronogramasSection
          clientId={id}
          cronogramas={cronogramas}
          canManage={canManage}
        />

        {/* tarefas do cliente */}
        <Section title="Tarefas do cliente" hint={`${tasks.length} no total`}>
          {tasks.length === 0 ? (
            <Empty>Nenhuma tarefa vinculada a este cliente.</Empty>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap gap-2 text-xs">
                {[...tasksByStatus.entries()].map(([st, n]) => (
                  <span
                    key={st}
                    className="border-line rounded-full border px-2 py-0.5"
                  >
                    {TASK_STATUS_LABEL[st] ?? st}: {n}
                  </span>
                ))}
              </div>
              <div className="space-y-1.5">
                {tasks.slice(0, 8).map((t) => (
                  <div
                    key={t.id}
                    className="border-line flex items-center justify-between rounded-lg border p-2.5 text-sm"
                  >
                    <span className="truncate">{t.title}</span>
                    <span className="text-ink-muted ml-2 shrink-0 text-[11px]">
                      {TASK_STATUS_LABEL[t.status] ?? t.status}
                      {t.due_date ? ` · ${formatDate(t.due_date)}` : ""}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/tarefas"
                className="text-data-text mt-2 inline-block text-xs hover:underline"
              >
                ver no quadro de tarefas →
              </Link>
            </>
          )}
        </Section>

        {/* entregas roll-up */}
        <Section
          title="Entregas"
          hint={`${deliveries.length} das tarefas do cliente`}
        >
          {deliveries.length === 0 ? (
            <Empty>Nenhuma entrega registrada nas tarefas deste cliente.</Empty>
          ) : (
            <div className="space-y-2">
              {deliveries.map((d) => (
                <div key={d.id} className="border-line rounded-lg border p-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-ink-muted">
                      {titleByTask.get(d.task_id) ?? "—"}
                    </span>
                    <span>{DELIVERY_LABEL[d.status] ?? d.status}</span>
                  </div>
                  {d.description && (
                    <div className="mt-1 text-sm">{d.description}</div>
                  )}
                  <div className="text-ink-muted mt-1 flex items-center gap-2 text-[11px]">
                    {d.drive_folder_url && (
                      <a
                        href={d.drive_folder_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-data-text hover:underline"
                      >
                        Drive
                      </a>
                    )}
                    <span>{formatDate(d.submitted_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* propostas */}
        <Section title="Propostas">
          <div className="text-ink-muted text-sm">
            <p>Nenhuma proposta registrada pra este cliente ainda.</p>
            <a
              href={`${PUBLIC_GEN}/admin`}
              target="_blank"
              rel="noreferrer"
              className="text-data-text mt-1 inline-flex items-center gap-1 text-xs hover:underline"
            >
              Abrir gerador de propostas
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </Section>
      </div>
    </>
  );
}
