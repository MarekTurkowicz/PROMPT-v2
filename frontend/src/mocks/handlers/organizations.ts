import { http, HttpResponse } from "msw";
import type { ApiError, MyOrganization } from "@/api/types";
import { currentUser, db } from "../db";
import { ROLE_PERMISSIONS, type SeedMembership } from "../seed/organizations";

const error = (status: number, detail: string, code: string) =>
  HttpResponse.json<ApiError>({ detail, code }, { status });

function toMyOrganization(m: SeedMembership): MyOrganization {
  const org = db.organizations.find((o) => o.id === m.organization_id)!;
  const usable = org.is_active && m.status === "active";
  return {
    id: org.id,
    name: org.name,
    is_active: org.is_active,
    membership_status: m.status as MyOrganization["membership_status"],
    permissions: usable ? ROLE_PERMISSIONS[m.role] : [],
  };
}

export const organizationHandlers = [
  http.get("/api/me/organizations", () => {
    const user = currentUser();
    if (!user) return error(401, "Not authenticated", "not_authenticated");
    return HttpResponse.json(
      db.memberships
        .filter(
          (m) =>
            m.user_id === user.id &&
            (m.status === "active" || m.status === "invited"),
        )
        .map(toMyOrganization),
    );
  }),

  // Not in PRD 2.1 §9 yet: proposed endpoint for accepting an invitation (P3).
  http.post<{ orgId: string }>(
    "/api/me/organizations/:orgId/accept",
    ({ params }) => {
      const user = currentUser();
      if (!user) return error(401, "Not authenticated", "not_authenticated");
      const membership = db.memberships.find(
        (m) =>
          m.user_id === user.id &&
          m.organization_id === Number(params.orgId) &&
          m.status === "invited",
      );
      if (!membership) return error(404, "Invitation not found", "not_found");
      membership.status = "active";
      return HttpResponse.json(toMyOrganization(membership));
    },
  ),
];
