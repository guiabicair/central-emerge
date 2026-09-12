"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  ChevronDown,
  ChevronRight,
  Crown,
  ImageUp,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import type { AppRoleWithPerms, TeamMember } from "@/lib/auth/roles";
import type {
  EffectiveRole,
  OrgCompany,
  OrgData,
  OrgTeam,
} from "@/lib/equipe/org-queries";
import {
  createCompany,
  createTeam,
  deleteCompany,
  deleteTeam,
  removeCompanyLogo,
  setCompanyClients,
  setCompanyMembers,
  setCompanyRoles,
  setTeamMembers,
  setTeamRoles,
  updateCompany,
  updateTeam,
  uploadCompanyLogo,
} from "@/app/(app)/equipe/organizacao/actions";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const OrgCanvas = dynamic(
  () => import("@/components/equipe/org-canvas").then((m) => m.OrgCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground grid h-full place-items-center text-sm">
        Carregando canvas…
      </div>
    ),
  },
);

const COLORS = ["#45f0d1", "#c9ff3f", "#93a6ff", "#fbbf24", "#ff8f6b", "#c98bff"];

function personName(p: TeamMember) {
  return p.full_name?.trim() || p.email;
}

function originLabel(source: string) {
  if (source === "direto") return "direto";
  if (source.startsWith("time:")) return `via time ${source.slice(5)}`;
  if (source.startsWith("empresa:")) return `via ${source.slice(8)}`;
  return source;
}

/* ================================================================== */

export function OrgView({
  data,
  canManage,
  canvasPositions,
}: {
  data: OrgData;
  canManage: boolean;
  canvasPositions: Record<string, { x: number; y: number }>;
}) {
  const [view, setView] = useState<"lista" | "nodes">("lista");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [dialog, setDialog] = useState<DialogState>(null);

  const toggle = (key: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /* ---------- índices ---------- */
  const companyById = useMemo(
    () => new Map(data.companies.map((c) => [c.id, c])),
    [data.companies],
  );
  const roleById = useMemo(
    () => new Map(data.roles.map((r) => [r.id, r])),
    [data.roles],
  );
  const peopleById = useMemo(
    () => new Map(data.people.map((p) => [p.user_id, p])),
    [data.people],
  );
  const clientById = useMemo(
    () => new Map(data.clients.map((c) => [c.id, c])),
    [data.clients],
  );

  const childrenOf = useMemo(() => {
    const m = new Map<string | null, OrgCompany[]>();
    for (const c of data.companies) {
      const key = c.parent_id && companyById.has(c.parent_id) ? c.parent_id : null;
      const arr = m.get(key) ?? [];
      arr.push(c);
      m.set(key, arr);
    }
    return m;
  }, [data.companies, companyById]);

  const teamsByCompany = useMemo(() => {
    const m = new Map<string, OrgTeam[]>();
    for (const t of data.teams) {
      const arr = m.get(t.company_id) ?? [];
      arr.push(t);
      m.set(t.company_id, arr);
    }
    return m;
  }, [data.teams]);

  const membersByTeam = useMemo(() => {
    const m = new Map<string, { user_id: string; is_lead: boolean }[]>();
    for (const tm of data.teamMembers) {
      const arr = m.get(tm.team_id) ?? [];
      arr.push({ user_id: tm.user_id, is_lead: tm.is_lead });
      m.set(tm.team_id, arr);
    }
    return m;
  }, [data.teamMembers]);

  const membersByCompany = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const cm of data.companyMembers) {
      const arr = m.get(cm.company_id) ?? [];
      arr.push(cm.user_id);
      m.set(cm.company_id, arr);
    }
    return m;
  }, [data.companyMembers]);

  const rolesByTeam = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const tr of data.teamRoles) {
      const arr = m.get(tr.team_id) ?? [];
      arr.push(tr.role_id);
      m.set(tr.team_id, arr);
    }
    return m;
  }, [data.teamRoles]);

  const rolesByCompany = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const cr of data.companyRoles) {
      const arr = m.get(cr.company_id) ?? [];
      arr.push(cr.role_id);
      m.set(cr.company_id, arr);
    }
    return m;
  }, [data.companyRoles]);

  const clientsByCompany = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const cc of data.companyClients) {
      const arr = m.get(cc.company_id) ?? [];
      arr.push(cc.client_id);
      m.set(cc.company_id, arr);
    }
    return m;
  }, [data.companyClients]);

  const effectiveByUser = useMemo(() => {
    const m = new Map<string, EffectiveRole[]>();
    const seen = new Set<string>();
    for (const e of data.effectiveRoles) {
      const key = `${e.user_id}|${e.role_id}|${e.source}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const arr = m.get(e.user_id) ?? [];
      arr.push(e);
      m.set(e.user_id, arr);
    }
    return m;
  }, [data.effectiveRoles]);

  /** pessoas distintas ligadas à empresa: membros diretos + membros dos times dela. */
  function companyPeopleCount(companyId: string) {
    const set = new Set(membersByCompany.get(companyId) ?? []);
    for (const t of teamsByCompany.get(companyId) ?? []) {
      for (const mm of membersByTeam.get(t.id) ?? []) set.add(mm.user_id);
    }
    return set.size;
  }

  const roots = childrenOf.get(null) ?? [];

  /* ---------- render ---------- */
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="nodes">Nodes</TabsTrigger>
          </TabsList>
        </Tabs>
        {canManage && view === "lista" && (
          <button
            type="button"
            onClick={() => setDialog({ kind: "company", company: null, parentId: null })}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#c9ff3f] px-3 py-1.5 text-xs font-semibold text-[#0a0b0c]"
          >
            <Plus className="size-3.5" /> Nova empresa
          </button>
        )}
      </div>

      {view === "nodes" ? (
        <div className="min-h-0 flex-1">
          <OrgCanvas
            data={data}
            positions={canvasPositions}
            canManage={canManage}
            onDialog={setDialog}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {roots.length === 0 ? (
            <div className="border-border text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
              Nenhuma empresa ainda.
              {canManage && " Crie a primeira em “Nova empresa”."}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {roots.map((c) => (
                <CompanyBlock
                  key={c.id}
                  company={c}
                  depth={0}
                  ancestry={new Set()}
                  canManage={canManage}
                  ctx={{
                    expanded,
                    toggle,
                    setDialog,
                    childrenOf,
                    teamsByCompany,
                    membersByTeam,
                    membersByCompany,
                    rolesByTeam,
                    rolesByCompany,
                    clientsByCompany,
                    roleById,
                    peopleById,
                    clientById,
                    effectiveByUser,
                    companyPeopleCount,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------- dialogs ----------------------------- */}
      {dialog?.kind === "company" && (
        <CompanyDialog
          company={dialog.company}
          parentId={dialog.parentId}
          companies={data.companies}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "team" && (
        <TeamDialog
          team={dialog.team}
          companyId={dialog.companyId}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "team-members" && (
        <TeamMembersDialog
          team={dialog.team}
          people={data.people}
          current={membersByTeam.get(dialog.team.id) ?? []}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "company-members" && (
        <PickerDialog
          title={`Pessoas de ${dialog.company.name}`}
          hint="Pessoas ligadas direto à empresa (sem passar por um time)."
          options={data.people.map((p) => ({
            id: p.user_id,
            label: personName(p),
            sub: p.email,
          }))}
          current={membersByCompany.get(dialog.company.id) ?? []}
          onSave={(ids) => setCompanyMembers(dialog.company.id, ids)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "team-roles" && (
        <PickerDialog
          title={`Papéis do time ${dialog.team.name}`}
          hint="Todo membro do time herda esses papéis (e as permissões deles)."
          options={data.roles.map((r) => ({ id: r.id, label: r.name, sub: r.slug }))}
          current={rolesByTeam.get(dialog.team.id) ?? []}
          onSave={(ids) => setTeamRoles(dialog.team.id, ids)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "company-roles" && (
        <PickerDialog
          title={`Papéis de ${dialog.company.name}`}
          hint="Quem está na empresa (direto ou por um time dela) herda esses papéis."
          options={data.roles.map((r) => ({ id: r.id, label: r.name, sub: r.slug }))}
          current={rolesByCompany.get(dialog.company.id) ?? []}
          onSave={(ids) => setCompanyRoles(dialog.company.id, ids)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "company-clients" && (
        <PickerDialog
          title={`Clientes de ${dialog.company.name}`}
          hint="Vínculo N:N — um cliente pode estar em mais de uma empresa."
          options={data.clients.map((c) => ({ id: c.id, label: c.name }))}
          current={clientsByCompany.get(dialog.company.id) ?? []}
          onSave={(ids) => setCompanyClients(dialog.company.id, ids)}
          onClose={() => setDialog(null)}
          empty="Nenhum cliente curado. Cadastre em Clientes primeiro."
        />
      )}
      {dialog?.kind === "delete-company" && (
        <ConfirmDialog
          title={`Excluir a empresa “${dialog.company.name}”?`}
          body="Somem os times dela, os vínculos de pessoas, os papéis atribuídos e os vínculos de cliente. Os clientes em si NÃO são apagados. Empresas-filhas ficam sem matriz. Não dá pra desfazer."
          confirmLabel="Excluir empresa"
          onConfirm={() => deleteCompany(dialog.company.id)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "delete-team" && (
        <ConfirmDialog
          title={`Excluir o time “${dialog.team.name}”?`}
          body="Somem os membros e os papéis do time. As pessoas continuam na Central. Não dá pra desfazer."
          confirmLabel="Excluir time"
          onConfirm={() => deleteTeam(dialog.team.id)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

/* ================================================================== *
 * Tipos de dialog + contexto de render
 * ================================================================== */

export type DialogState =
  | { kind: "company"; company: OrgCompany | null; parentId: string | null }
  | { kind: "team"; team: OrgTeam | null; companyId: string }
  | { kind: "team-members"; team: OrgTeam }
  | { kind: "company-members"; company: OrgCompany }
  | { kind: "team-roles"; team: OrgTeam }
  | { kind: "company-roles"; company: OrgCompany }
  | { kind: "company-clients"; company: OrgCompany }
  | { kind: "delete-company"; company: OrgCompany }
  | { kind: "delete-team"; team: OrgTeam }
  | null;

interface Ctx {
  expanded: Set<string>;
  toggle: (key: string) => void;
  setDialog: (d: DialogState) => void;
  childrenOf: Map<string | null, OrgCompany[]>;
  teamsByCompany: Map<string, OrgTeam[]>;
  membersByTeam: Map<string, { user_id: string; is_lead: boolean }[]>;
  membersByCompany: Map<string, string[]>;
  rolesByTeam: Map<string, string[]>;
  rolesByCompany: Map<string, string[]>;
  clientsByCompany: Map<string, string[]>;
  roleById: Map<string, AppRoleWithPerms>;
  peopleById: Map<string, TeamMember>;
  clientById: Map<string, { id: string; name: string }>;
  effectiveByUser: Map<string, EffectiveRole[]>;
  companyPeopleCount: (companyId: string) => number;
}

/* ================================================================== *
 * Bloco de empresa (recursivo)
 * ================================================================== */

function CompanyBlock({
  company,
  depth,
  ancestry,
  canManage,
  ctx,
}: {
  company: OrgCompany;
  depth: number;
  ancestry: Set<string>;
  canManage: boolean;
  ctx: Ctx;
}) {
  if (ancestry.has(company.id)) return null; // guarda anti-ciclo no render
  const key = `co:${company.id}`;
  const open = ctx.expanded.has(key);
  const teams = ctx.teamsByCompany.get(company.id) ?? [];
  const children = ctx.childrenOf.get(company.id) ?? [];
  const directMembers = ctx.membersByCompany.get(company.id) ?? [];
  const roleIds = ctx.rolesByCompany.get(company.id) ?? [];
  const clientIds = ctx.clientsByCompany.get(company.id) ?? [];
  const isHolding = children.length > 0;

  return (
    <div
      className="border-border bg-card/40 rounded-xl border"
      style={{ marginLeft: depth ? 16 : 0 }}
    >
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          onClick={() => ctx.toggle(key)}
          className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0"
          aria-label={open ? "Recolher" : "Expandir"}
        >
          {open ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>

        {company.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.logo_url}
            alt=""
            className="border-border size-8 shrink-0 rounded-md border object-cover"
          />
        ) : (
          <span
            className="grid size-8 shrink-0 place-items-center rounded-md text-[10px] font-bold text-[#0a0b0c]"
            style={{ background: company.color ?? "#8b918f" }}
          >
            {company.name.slice(0, 2).toUpperCase()}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{company.name}</span>
            {isHolding && (
              <span className="rounded-full bg-[#93a6ff]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#93a6ff]">
                holding
              </span>
            )}
            {company.frente_slug && (
              <span className="text-muted-foreground text-[10px]">
                frente: {company.frente_slug}
              </span>
            )}
          </div>
          <div className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 text-[11px]">
            <span>{teams.length} times</span>
            <span>{ctx.companyPeopleCount(company.id)} pessoas</span>
            <span>{clientIds.length} clientes</span>
          </div>
          {roleIds.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {roleIds.map((rid) => {
                const r = ctx.roleById.get(rid);
                if (!r) return null;
                return <RoleChip key={rid} name={r.name} color={r.color} tag="empresa" />;
              })}
            </div>
          )}
        </div>

        {canManage && (
          <div className="text-muted-foreground flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            <IconBtn
              title="Editar empresa"
              onClick={() =>
                ctx.setDialog({ kind: "company", company, parentId: company.parent_id })
              }
            >
              <Pencil className="size-3.5" />
            </IconBtn>
            <IconBtn
              title="Logo"
              onClick={() =>
                ctx.setDialog({ kind: "company", company, parentId: company.parent_id })
              }
            >
              <ImageUp className="size-3.5" />
            </IconBtn>
            <TextBtn
              onClick={() => ctx.setDialog({ kind: "company-roles", company })}
            >
              papéis
            </TextBtn>
            <TextBtn
              onClick={() => ctx.setDialog({ kind: "company-members", company })}
            >
              pessoas
            </TextBtn>
            <TextBtn
              onClick={() => ctx.setDialog({ kind: "company-clients", company })}
            >
              clientes
            </TextBtn>
            <TextBtn
              onClick={() =>
                ctx.setDialog({ kind: "team", team: null, companyId: company.id })
              }
            >
              + time
            </TextBtn>
            <IconBtn
              title="Excluir empresa"
              danger
              onClick={() => ctx.setDialog({ kind: "delete-company", company })}
            >
              <Trash2 className="size-3.5" />
            </IconBtn>
          </div>
        )}
      </div>

      {open && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          {children.map((child) => (
            <CompanyBlock
              key={child.id}
              company={child}
              depth={depth + 1}
              ancestry={new Set([...ancestry, company.id])}
              canManage={canManage}
              ctx={ctx}
            />
          ))}

          {teams.map((t) => (
            <TeamBlock
              key={t.id}
              team={t}
              canManage={canManage}
              ctx={ctx}
            />
          ))}

          {directMembers.length > 0 && (
            <div className="border-border ml-4 rounded-lg border border-dashed p-2">
              <div className="text-muted-foreground mb-1 text-[10px] font-semibold uppercase">
                Direto na empresa
              </div>
              <div className="flex flex-col gap-1.5">
                {directMembers.map((uid) => (
                  <PersonRow
                    key={uid}
                    person={ctx.peopleById.get(uid)}
                    userId={uid}
                    effective={ctx.effectiveByUser.get(uid) ?? []}
                  />
                ))}
              </div>
            </div>
          )}

          {children.length === 0 && teams.length === 0 && directMembers.length === 0 && (
            <p className="text-muted-foreground ml-4 text-xs">
              Vazia — adicione um time ou pessoas.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== *
 * Bloco de time
 * ================================================================== */

function TeamBlock({
  team,
  canManage,
  ctx,
}: {
  team: OrgTeam;
  canManage: boolean;
  ctx: Ctx;
}) {
  const key = `team:${team.id}`;
  const open = ctx.expanded.has(key);
  const members = ctx.membersByTeam.get(team.id) ?? [];
  const roleIds = ctx.rolesByTeam.get(team.id) ?? [];
  const lead = members.find((m) => m.is_lead);
  const leadPerson = lead ? ctx.peopleById.get(lead.user_id) : undefined;

  return (
    <div className="border-border ml-4 rounded-lg border">
      <div className="flex items-start gap-2 p-2.5">
        <button
          type="button"
          onClick={() => ctx.toggle(key)}
          className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0"
          aria-label={open ? "Recolher" : "Expandir"}
        >
          {open ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>
        <span
          className="mt-0.5 grid size-6 shrink-0 place-items-center rounded"
          style={{ background: `${team.color ?? "#8b918f"}22` }}
        >
          <Users
            className="size-3.5"
            style={{ color: team.color ?? "#8b918f" }}
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{team.name}</span>
            <span className="text-muted-foreground text-[11px]">
              {members.length} {members.length === 1 ? "membro" : "membros"}
            </span>
            {leadPerson && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#fbbf24]">
                <Crown className="size-3" /> {personName(leadPerson)}
              </span>
            )}
          </div>
          {roleIds.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {roleIds.map((rid) => {
                const r = ctx.roleById.get(rid);
                if (!r) return null;
                return <RoleChip key={rid} name={r.name} color={r.color} tag="time" />;
              })}
            </div>
          )}
        </div>

        {canManage && (
          <div className="text-muted-foreground flex shrink-0 items-center gap-1.5">
            <IconBtn
              title="Editar time"
              onClick={() =>
                ctx.setDialog({ kind: "team", team, companyId: team.company_id })
              }
            >
              <Pencil className="size-3.5" />
            </IconBtn>
            <TextBtn onClick={() => ctx.setDialog({ kind: "team-roles", team })}>
              papéis
            </TextBtn>
            <TextBtn onClick={() => ctx.setDialog({ kind: "team-members", team })}>
              membros
            </TextBtn>
            <IconBtn
              title="Excluir time"
              danger
              onClick={() => ctx.setDialog({ kind: "delete-team", team })}
            >
              <Trash2 className="size-3.5" />
            </IconBtn>
          </div>
        )}
      </div>

      {open && (
        <div className="flex flex-col gap-1.5 px-2.5 pb-2.5 pl-10">
          {members.length === 0 ? (
            <p className="text-muted-foreground text-xs">Sem membros.</p>
          ) : (
            members.map((m) => (
              <PersonRow
                key={m.user_id}
                person={ctx.peopleById.get(m.user_id)}
                userId={m.user_id}
                isLead={m.is_lead}
                effective={ctx.effectiveByUser.get(m.user_id) ?? []}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== *
 * Linha de pessoa + badges de papel efetivo com origem
 * ================================================================== */

function PersonRow({
  person,
  userId,
  isLead,
  effective,
}: {
  person: TeamMember | undefined;
  userId: string;
  isLead?: boolean;
  effective: EffectiveRole[];
}) {
  const label = person ? personName(person) : `Usuário ${userId.slice(0, 8)}`;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span className="bg-muted grid size-5 shrink-0 place-items-center overflow-hidden rounded-full text-[9px] font-semibold">
        {person?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.avatar_url} alt="" className="size-full object-cover" />
        ) : (
          label.slice(0, 2).toUpperCase()
        )}
      </span>
      <span className="font-medium">{label}</span>
      {isLead && <Crown className="size-3 text-[#fbbf24]" />}
      {person?.email && person.full_name && (
        <span className="text-muted-foreground text-[11px]">{person.email}</span>
      )}
      <div className="flex flex-wrap gap-1">
        {effective.length === 0 ? (
          <span className="text-muted-foreground text-[10px]">sem papéis</span>
        ) : (
          effective.map((e, i) => (
            <span
              key={`${e.role_id}-${e.source}-${i}`}
              className="border-border inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px]"
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: e.role_color ?? "#8b918f" }}
              />
              <span className="font-medium">{e.role_name}</span>
              <span className="text-muted-foreground">· {originLabel(e.source)}</span>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/* ================================================================== *
 * Peças pequenas
 * ================================================================== */

function RoleChip({
  name,
  color,
  tag,
}: {
  name: string;
  color: string | null;
  tag: string;
}) {
  return (
    <span className="border-border inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px]">
      <span
        className="size-1.5 rounded-full"
        style={{ background: color ?? "#8b918f" }}
      />
      <span className="font-medium">{name}</span>
      <span className="text-muted-foreground">· {tag}</span>
    </span>
  );
}

function IconBtn({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "hover:text-foreground rounded p-1 transition-colors",
        danger && "hover:text-[#ff5d5d]",
      )}
    >
      {children}
    </button>
  );
}

function TextBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:text-foreground hover:border-border rounded border border-transparent px-1.5 py-0.5 text-[11px] transition-colors"
    >
      {children}
    </button>
  );
}

/** Resultado das server actions de org — erro esperado volta como `{ error }`. */
type ActionResult = { error?: string } | void;

function useAct() {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => {
      try {
        const res = await fn();
        if (res && res.error) {
          toast.error(res.error); // mantém o dialog aberto
          return;
        }
        after?.();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falhou");
      }
    });
  return { pending, run };
}

/* ================================================================== *
 * Overlay base
 * ================================================================== */

function Overlay({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="border-border bg-card w-full max-w-md rounded-xl border p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ================================================================== *
 * Empresa — criar / editar (+ logo)
 * ================================================================== */

function CompanyDialog({
  company,
  parentId,
  companies,
  onClose,
}: {
  company: OrgCompany | null;
  parentId: string | null;
  companies: OrgCompany[];
  onClose: () => void;
}) {
  const { pending, run } = useAct();
  const [name, setName] = useState(company?.name ?? "");
  const [color, setColor] = useState(company?.color ?? COLORS[0]);
  const [frente, setFrente] = useState(company?.frente_slug ?? "");
  const [parent, setParent] = useState<string>(company?.parent_id ?? parentId ?? "");
  const [logo, setLogo] = useState<string | null>(company?.logo_url ?? null);

  // matrizes possíveis: qualquer empresa menos ela mesma. Ciclos mais fundos e
  // self-parent por outros caminhos são barrados no trigger 0021 (fonte da verdade).
  const parentOptions = companies.filter((c) => c.id !== company?.id);

  function save() {
    if (company && parent && parent === company.id) {
      toast.error("Uma empresa não pode ser matriz de si mesma.");
      return;
    }
    run(
      () =>
        company
          ? updateCompany(company.id, {
              name,
              color,
              frente_slug: frente,
              parent_id: parent || null,
            })
          : createCompany({
              name,
              color,
              frente_slug: frente,
              parent_id: parent || null,
            }),
      onClose,
    );
  }

  function onLogoFile(file: File) {
    if (!company) {
      toast.error("Salve a empresa antes de subir o logo.");
      return;
    }
    const fd = new FormData();
    fd.set("company_id", company.id);
    fd.set("file", file);
    run(async () => {
      const res = await uploadCompanyLogo(fd);
      if (res?.error) return res;
      toast.success("Logo atualizado");
      setLogo(URL.createObjectURL(file));
      return res;
    });
  }

  return (
    <Overlay onClose={onClose}>
      <h3 className="text-sm font-semibold">
        {company ? "Editar empresa" : "Nova empresa"}
      </h3>

      <label className="mt-3 block">
        <span className="text-muted-foreground text-[11px] font-semibold uppercase">
          Nome
        </span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Emerge Eventos"
          className="border-input bg-background mt-1 h-9 w-full rounded-md border px-2.5 text-sm outline-none"
        />
      </label>

      <div className="mt-3">
        <span className="text-muted-foreground text-[11px] font-semibold uppercase">
          Cor
        </span>
        <div className="mt-1.5 flex gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "size-6 rounded-full",
                color === c && "ring-2 ring-offset-2 ring-offset-[#0a0b0c]",
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      <label className="mt-3 block">
        <span className="text-muted-foreground text-[11px] font-semibold uppercase">
          Matriz (holding / grupo)
        </span>
        <select
          value={parent}
          onChange={(e) => setParent(e.target.value)}
          className="border-input bg-background mt-1 h-9 w-full rounded-md border px-2.5 text-sm outline-none"
        >
          <option value="">— nenhuma —</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-3 block">
        <span className="text-muted-foreground text-[11px] font-semibold uppercase">
          Frente (opcional)
        </span>
        <input
          value={frente}
          onChange={(e) => setFrente(e.target.value)}
          placeholder="Ex.: eventos"
          className="border-input bg-background mt-1 h-9 w-full rounded-md border px-2.5 text-sm outline-none"
        />
      </label>

      <div className="mt-3">
        <span className="text-muted-foreground text-[11px] font-semibold uppercase">
          Logo
        </span>
        <div className="mt-1.5 flex items-center gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              className="border-border size-12 rounded-md border object-cover"
            />
          ) : (
            <span
              className="grid size-12 place-items-center rounded-md text-xs font-bold text-[#0a0b0c]"
              style={{ background: color }}
            >
              {(name || "?").slice(0, 2).toUpperCase()}
            </span>
          )}
          <label className="border-border hover:bg-card/50 cursor-pointer rounded-md border px-2.5 py-1.5 text-xs">
            {company ? "Enviar imagem" : "Salve primeiro"}
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={!company || pending}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onLogoFile(f);
                e.target.value = "";
              }}
            />
          </label>
          {company && logo && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const res = await removeCompanyLogo(company.id);
                  if (!res?.error) setLogo(null);
                  return res;
                })
              }
              className="text-muted-foreground hover:text-[#ff5d5d] text-xs"
            >
              remover
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground px-3 py-1.5 text-xs"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={pending || !name.trim()}
          onClick={save}
          className="rounded-md bg-[#c9ff3f] px-3 py-1.5 text-xs font-semibold text-[#0a0b0c] disabled:opacity-50"
        >
          {company ? "Salvar" : "Criar"}
        </button>
      </div>
    </Overlay>
  );
}

/* ================================================================== *
 * Time — criar / editar
 * ================================================================== */

function TeamDialog({
  team,
  companyId,
  onClose,
}: {
  team: OrgTeam | null;
  companyId: string;
  onClose: () => void;
}) {
  const { pending, run } = useAct();
  const [name, setName] = useState(team?.name ?? "");
  const [color, setColor] = useState(team?.color ?? COLORS[1]);

  function save() {
    run(
      () =>
        team
          ? updateTeam(team.id, { name, color })
          : createTeam(companyId, { name, color }),
      onClose,
    );
  }

  return (
    <Overlay onClose={onClose}>
      <h3 className="text-sm font-semibold">
        {team ? "Editar time" : "Novo time"}
      </h3>
      <label className="mt-3 block">
        <span className="text-muted-foreground text-[11px] font-semibold uppercase">
          Nome
        </span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Social Media"
          className="border-input bg-background mt-1 h-9 w-full rounded-md border px-2.5 text-sm outline-none"
        />
      </label>
      <div className="mt-3">
        <span className="text-muted-foreground text-[11px] font-semibold uppercase">
          Cor
        </span>
        <div className="mt-1.5 flex gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "size-6 rounded-full",
                color === c && "ring-2 ring-offset-2 ring-offset-[#0a0b0c]",
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground px-3 py-1.5 text-xs"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={pending || !name.trim()}
          onClick={save}
          className="rounded-md bg-[#c9ff3f] px-3 py-1.5 text-xs font-semibold text-[#0a0b0c] disabled:opacity-50"
        >
          {team ? "Salvar" : "Criar"}
        </button>
      </div>
    </Overlay>
  );
}

/* ================================================================== *
 * Picker genérico (papéis / pessoas / clientes)
 * ================================================================== */

function PickerDialog({
  title,
  hint,
  options,
  current,
  onSave,
  onClose,
  empty,
}: {
  title: string;
  hint?: string;
  options: { id: string; label: string; sub?: string }[];
  current: string[];
  onSave: (ids: string[]) => Promise<{ error?: string } | void>;
  onClose: () => void;
  empty?: string;
}) {
  const { pending, run } = useAct();
  const [sel, setSel] = useState<Set<string>>(() => new Set(current));
  const [q, setQ] = useState("");

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <Overlay onClose={onClose}>
      <h3 className="text-sm font-semibold">{title}</h3>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}

      {options.length > 8 && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar…"
          className="border-input bg-background mt-3 h-8 w-full rounded-md border px-2.5 text-sm outline-none"
        />
      )}

      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-xs">
            {empty ?? "Nada aqui."}
          </p>
        ) : (
          filtered.map((o) => {
            const on = sel.has(o.id);
            return (
              <label
                key={o.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm",
                  on ? "border-[#45f0d1]/40 bg-[#45f0d1]/5" : "border-border",
                )}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) =>
                    setSel((s) => {
                      const next = new Set(s);
                      if (e.target.checked) next.add(o.id);
                      else next.delete(o.id);
                      return next;
                    })
                  }
                  className="accent-[#45f0d1]"
                />
                <span className="flex-1">{o.label}</span>
                {o.sub && (
                  <code className="text-muted-foreground text-[10px]">{o.sub}</code>
                )}
              </label>
            );
          })
        )}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground px-3 py-1.5 text-xs"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => onSave([...sel]), onClose)}
          className="rounded-md bg-[#c9ff3f] px-3 py-1.5 text-xs font-semibold text-[#0a0b0c] disabled:opacity-50"
        >
          Salvar
        </button>
      </div>
    </Overlay>
  );
}

/* ================================================================== *
 * Membros de time (com is_lead)
 * ================================================================== */

function TeamMembersDialog({
  team,
  people,
  current,
  onClose,
}: {
  team: OrgTeam;
  people: TeamMember[];
  current: { user_id: string; is_lead: boolean }[];
  onClose: () => void;
}) {
  const { pending, run } = useAct();
  const [sel, setSel] = useState<Map<string, boolean>>(
    () => new Map(current.map((m) => [m.user_id, m.is_lead])),
  );
  const [q, setQ] = useState("");

  const filtered = people.filter((p) =>
    personName(p).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <Overlay onClose={onClose}>
      <h3 className="text-sm font-semibold">Membros do time {team.name}</h3>
      <p className="text-muted-foreground mt-1 text-xs">
        Marque quem está no time; a coroa define o lead.
      </p>

      {people.length > 8 && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar…"
          className="border-input bg-background mt-3 h-8 w-full rounded-md border px-2.5 text-sm outline-none"
        />
      )}

      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
        {filtered.map((p) => {
          const on = sel.has(p.user_id);
          const isLead = sel.get(p.user_id) ?? false;
          return (
            <div
              key={p.user_id}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm",
                on ? "border-[#45f0d1]/40 bg-[#45f0d1]/5" : "border-border",
              )}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={(e) =>
                  setSel((s) => {
                    const next = new Map(s);
                    if (e.target.checked) next.set(p.user_id, false);
                    else next.delete(p.user_id);
                    return next;
                  })
                }
                className="accent-[#45f0d1]"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{personName(p)}</span>
                {p.full_name && (
                  <span className="text-muted-foreground block truncate text-[10px]">
                    {p.email}
                  </span>
                )}
              </span>
              <button
                type="button"
                disabled={!on}
                title="Definir como lead"
                onClick={() =>
                  setSel((s) => {
                    const next = new Map(s);
                    // um lead por vez
                    for (const k of next.keys()) next.set(k, false);
                    next.set(p.user_id, !isLead);
                    return next;
                  })
                }
                className={cn(
                  "rounded p-1 transition-colors disabled:opacity-30",
                  isLead ? "text-[#fbbf24]" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Crown className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground px-3 py-1.5 text-xs"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () =>
                setTeamMembers(
                  team.id,
                  [...sel.entries()].map(([user_id, is_lead]) => ({
                    user_id,
                    is_lead,
                  })),
                ),
              onClose,
            )
          }
          className="rounded-md bg-[#c9ff3f] px-3 py-1.5 text-xs font-semibold text-[#0a0b0c] disabled:opacity-50"
        >
          Salvar
        </button>
      </div>
    </Overlay>
  );
}

/* ================================================================== *
 * Confirmação de exclusão (modal in-React — nada de window.confirm)
 * ================================================================== */

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => Promise<{ error?: string } | void>;
  onClose: () => void;
}) {
  const { pending, run } = useAct();
  return (
    <Overlay onClose={onClose}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{body}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground px-3 py-1.5 text-xs"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(onConfirm, onClose)}
          className="rounded-md bg-[#ff5d5d] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {confirmLabel}
        </button>
      </div>
    </Overlay>
  );
}
