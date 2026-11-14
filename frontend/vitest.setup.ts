import "@testing-library/jest-dom";
import "@/app/i18n";
import { afterAll, afterEach, beforeAll } from "vitest";
import { resetDb } from "@/mocks/db";
import { server } from "@/mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetDb();
  sessionStorage.clear();
});
afterAll(() => server.close());
