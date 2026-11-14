import type { MembershipStatus, Permission } from "@/api/types";

export type RoleCode =
  | "viewer"
  | "member"
  | "project_manager"
  | "project_director"
  | "organization_director"
  | "organization_admin";

const VIEWER: Permission[] = [
  "project.view",
  "task.view",
  "funding.view",
  "budget.view",
  "team.view",
  "report.view",
];
const MEMBER: Permission[] = [
  ...VIEWER,
  "checklist.edit",
  "time.log",
  "comment.create",
];
const PROJECT_MANAGER: Permission[] = [
  ...MEMBER,
  "task.create",
  "task.edit",
  "task.delete",
  "task.assign",
  "task.plan",
  "comment.moderate",
  "project.create",
  "project.edit",
  "milestone.manage",
  "status.manage_project",
  "group.manage_project",
  "role.grant_project",
  "funding.manage",
  "funding.attach",
  "template.manage",
  "expense.manage",
  "budget.export",
];
const PROJECT_DIRECTOR: Permission[] = [...PROJECT_MANAGER, "project.close"];
const ORGANIZATION_DIRECTOR: Permission[] = [
  ...PROJECT_DIRECTOR,
  "project.delete",
];

// Built-in roles, PRD 2.1 §3.2 and §3.5.
export const ROLE_PERMISSIONS: Record<RoleCode, Permission[]> = {
  viewer: VIEWER,
  member: MEMBER,
  project_manager: PROJECT_MANAGER,
  project_director: PROJECT_DIRECTOR,
  organization_director: ORGANIZATION_DIRECTOR,
  organization_admin: [
    ...ORGANIZATION_DIRECTOR,
    "member.manage",
    "role.manage",
    "group.manage",
    "status.manage",
    "org.settings",
  ],
};

export type SeedOrganization = { id: number; name: string; is_active: boolean };

export type SeedMembership = {
  organization_id: number;
  user_id: number;
  status: MembershipStatus;
  role: RoleCode;
  job_title: string;
};

// Organizations and memberships from the mock-up.
export const seedOrganizations: SeedOrganization[] = [
  { id: 1, name: "Studio Produktowe", is_active: true },
  { id: 2, name: "Zespół Infrastruktury", is_active: true },
  { id: 3, name: "Dział Finansów", is_active: true },
];

const m = (
  organization_id: number,
  user_id: number,
  status: MembershipStatus,
  role: RoleCode,
  job_title: string,
): SeedMembership => ({ organization_id, user_id, status, role, job_title });

export const seedMemberships: SeedMembership[] = [
  m(1, 1, "active", "organization_admin", "Dyrektor operacyjna"),
  m(1, 2, "active", "project_manager", "Kierownik projektów"),
  m(1, 3, "active", "member", "Projektantka UX"),
  m(1, 4, "active", "member", "Programista"),
  m(1, 5, "active", "member", "Programistka"),
  m(1, 6, "invited", "viewer", "Analityk"),
  m(2, 2, "active", "member", "Konsultant"),
  m(2, 3, "active", "organization_admin", "Kierowniczka zespołu"),
  m(2, 4, "active", "project_manager", "Inżynier DevOps"),
  m(2, 5, "suspended", "member", "Programistka"),
  m(3, 1, "active", "organization_admin", "Dyrektor finansowa"),
  m(3, 6, "active", "member", "Księgowy"),
  m(3, 2, "invited", "member", "Kierownik projektów"),
];
