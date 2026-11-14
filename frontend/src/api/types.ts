// Hand-written API types until #36 generates them from OpenAPI.
// Field names follow the Django models and PRD 2.1 §7 / §9.

export type Me = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
};

export type LoginRequest = { email: string; password: string };

export type TokenPair = { access: string; refresh: string };

export type ApiError = { detail: string; code?: string; field?: string };

// PRD 2.1 §3.4
export type Permission =
  | "project.view"
  | "task.view"
  | "funding.view"
  | "budget.view"
  | "team.view"
  | "report.view"
  | "task.create"
  | "task.edit"
  | "task.delete"
  | "task.assign"
  | "task.plan"
  | "checklist.edit"
  | "time.log"
  | "comment.create"
  | "comment.moderate"
  | "project.create"
  | "project.edit"
  | "project.close"
  | "project.delete"
  | "milestone.manage"
  | "status.manage_project"
  | "group.manage_project"
  | "role.grant_project"
  | "funding.manage"
  | "funding.attach"
  | "template.manage"
  | "expense.manage"
  | "budget.export"
  | "member.manage"
  | "role.manage"
  | "group.manage"
  | "status.manage"
  | "org.settings";

export type MembershipStatus = "invited" | "active" | "suspended" | "left";

// GET /api/me/organizations: suspended and left memberships are not listed (P3).
// `permissions` are the effective organization-wide ones (PRD 2.1 §3.1);
// empty for an invitation or a blocked organization.
export type MyOrganization = {
  id: number;
  name: string;
  is_active: boolean;
  membership_status: "invited" | "active";
  permissions: Permission[];
};
