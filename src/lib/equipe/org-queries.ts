import "server-only";

import {
  listRoles,
  listTeam,
  type AppRoleWithPerms,
  type TeamMember,
} from "@/lib/auth/roles";
import { createUntypedClient } from "@/lib/supabase/server";

/* ------------------------------------------------------------------ *
 * Tipos das tabelas app_* da migration 0018 (Equipe / Organização).
 * Escritos à mão — não estão no database.types.ts ainda.
 * ------------------------------------------------------------------ */

export interface OrgCompany {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  parent_id: string | null;
  frente_slug: string | null;
  logo_url: string | null;
  position: number;
}

export interface OrgTeam {
  id: string;
  company_id: string;
  name: string;
  color: string | null;
  position: number;
}

export interface OrgTeamMember {
  team_id: string;
  user_id: string;
  is_lead: boolean;
}

export interface OrgCompanyMember {
  company_id: string;
  user_id: string;
}

export interface OrgTeamRole {
  team_id: string;
  role_id: string;
}

export interface OrgCompanyRole {
  company_id: string;
  role_id: string;
}

export interface OrgCompanyClient {
  company_id: string;
  client_id: string;
}

export interface OrgClient {
  id: string;
  name: string;
}

/** Linha de `app_effective_roles_all()` — papel + a origem (direto / time:X / empresa:Y). */
export interface EffectiveRole {
  user_id: string;
  role_id: string;
  role_name: string;
  role_color: string | null;
  source: string;
}

export interface OrgData {
  companies: OrgCompany[];
  teams: OrgTeam[];
  teamMembers: OrgTeamMember[];
  companyMembers: OrgCompanyMember[];
  teamRoles: OrgTeamRole[];
  companyRoles: OrgCompanyRole[];
  companyClients: OrgCompanyClient[];
  people: TeamMember[];
  roles: AppRoleWithPerms[];
  clients: OrgClient[];
  effectiveRoles: EffectiveRole[];
}

const EMPTY: OrgData = {
  companies: [],
  teams: [],
  teamMembers: [],
  companyMembers: [],
  teamRoles: [],
  companyRoles: [],
  companyClients: [],
  people: [],
  roles: [],
  clients: [],
  effectiveRoles: [],
};

export async function getOrgData(): Promise<OrgData> {
  const db = await createUntypedClient();

  const [
    companies,
    teams,
    teamMembers,
    companyMembers,
    teamRoles,
    companyRoles,
    companyClients,
    people,
    roles,
    clients,
    effective,
  ] = await Promise.all([
    db
      .from("app_companies")
      .select("id, name, slug, color, parent_id, frente_slug, logo_url, position")
      .order("position")
      .order("name"),
    db
      .from("app_teams")
      .select("id, company_id, name, color, position")
      .order("position")
      .order("name"),
    db.from("app_team_members").select("team_id, user_id, is_lead"),
    db.from("app_company_members").select("company_id, user_id"),
    db.from("app_team_roles").select("team_id, role_id"),
    db.from("app_company_roles").select("company_id, role_id"),
    db.from("app_company_clients").select("company_id, client_id"),
    listTeam(),
    listRoles(),
    db.from("clients").select("id, name").eq("is_seed", true).order("name"),
    db.rpc("app_effective_roles_all"),
  ]);

  // Se as tabelas novas ainda não existirem em algum ambiente, degrada pra vazio
  // em vez de quebrar a página inteira.
  if (companies.error) return EMPTY;

  return {
    companies: (companies.data as OrgCompany[]) ?? [],
    teams: (teams.data as OrgTeam[]) ?? [],
    teamMembers: (teamMembers.data as OrgTeamMember[]) ?? [],
    companyMembers: (companyMembers.data as OrgCompanyMember[]) ?? [],
    teamRoles: (teamRoles.data as OrgTeamRole[]) ?? [],
    companyRoles: (companyRoles.data as OrgCompanyRole[]) ?? [],
    companyClients: (companyClients.data as OrgCompanyClient[]) ?? [],
    people,
    roles,
    clients: (clients.data as OrgClient[]) ?? [],
    effectiveRoles: (effective.data as EffectiveRole[]) ?? [],
  };
}
