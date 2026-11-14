import type { LoginRequest, Me, TokenPair } from "@/api/types";
import { api } from "@/app/api";

// Tokens are not stored yet: JWT handling comes with #37 / #24.
export const authApi = api.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation<TokenPair, LoginRequest>({
      query: (data) => ({ url: "/api/auth/login", method: "post", data }),
      invalidatesTags: ["Me"],
    }),
    logout: b.mutation<void, void>({
      query: () => ({ url: "/api/auth/logout", method: "post" }),
    }),
    me: b.query<Me, void>({
      query: () => ({ url: "/api/me" }),
      providesTags: ["Me"],
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useMeQuery } = authApi;
