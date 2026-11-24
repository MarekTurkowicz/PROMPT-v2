import { http, HttpResponse } from "msw";
import type { ApiError, LoginRequest, TokenPair } from "@/api/types";
import { currentUser, db, setCurrentUser } from "../db";

const notAuthenticated = () =>
  HttpResponse.json<ApiError>(
    { detail: "Not authenticated", code: "not_authenticated" },
    { status: 401 },
  );

export const authHandlers = [
  http.post<never, Partial<LoginRequest>, TokenPair | ApiError>(
    "/api/auth/login",
    async ({ request }) => {
      const { email, password } = await request.json();
      const user = db.users.find(
        (u) => u.email === email?.trim().toLowerCase(),
      );
      if (!user || !password) {
        return HttpResponse.json<ApiError>(
          { detail: "Invalid e-mail or password", code: "invalid_credentials" },
          { status: 400 },
        );
      }
      setCurrentUser(user.id);
      return HttpResponse.json<TokenPair>({
        access: `mock-access-${user.id}`,
        refresh: `mock-refresh-${user.id}`,
      });
    },
  ),

  http.post("/api/auth/logout", () => {
    setCurrentUser(null);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("/api/me", () => {
    const user = currentUser();
    return user ? HttpResponse.json(user) : notAuthenticated();
  }),
];
