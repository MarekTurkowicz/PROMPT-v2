import type { MyOrganization } from "@/api/types";
import { api } from "@/app/api";

export const organizationsApi = api.injectEndpoints({
  endpoints: (b) => ({
    myOrganizations: b.query<MyOrganization[], void>({
      query: () => ({ url: "/api/me/organizations" }),
      providesTags: ["MyOrganizations"],
    }),
    acceptInvitation: b.mutation<MyOrganization, number>({
      query: (orgId) => ({
        url: `/api/me/organizations/${orgId}/accept`,
        method: "post",
      }),
      invalidatesTags: ["MyOrganizations"],
    }),
  }),
});

export const { useMyOrganizationsQuery, useAcceptInvitationMutation } =
  organizationsApi;
