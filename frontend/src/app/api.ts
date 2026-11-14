import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";

// One API slice; features add their endpoints with api.injectEndpoints.
// Organization data lives under /api/orgs/{org}/… and provides "OrgData",
// so switching the organization refetches it.
export const api = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Me", "MyOrganizations", "OrgData"],
  endpoints: () => ({}),
});
