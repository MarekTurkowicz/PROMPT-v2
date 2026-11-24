import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setCurrentUser } from "@/mocks/db";
import { renderApp, t } from "@/test/renderApp";

async function logIn(email: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText(t("auth:email")), email);
  await user.type(screen.getByLabelText(t("auth:password")), "any-password");
  await user.click(screen.getByRole("button", { name: t("auth:submit") }));
  return user;
}

describe("login on the mock API", () => {
  it("sends an anonymous visitor to the login page", async () => {
    renderApp("/tasks");
    expect(
      await screen.findByRole("heading", { name: t("auth:title") }),
    ).toBeInTheDocument();
  });

  it("logs in with a demo account and opens the overview", async () => {
    renderApp("/login");
    await logIn("PM@example.com ");
    expect(await screen.findByText("Paweł Zieliński")).toBeInTheDocument();
    const breadcrumb = screen.getByRole("navigation", {
      name: t("nav.breadcrumb"),
    });
    expect(breadcrumb).toHaveTextContent(t("nav.overview"));
  });

  it("rejects an e-mail that is not in the demo data", async () => {
    renderApp("/login");
    await logIn("nobody@example.com");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("auth:errors.invalidCredentials"),
    );
  });

  it("logs out back to the login page", async () => {
    setCurrentUser(3);
    renderApp("/overview");
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: t("user.logout") }),
    );
    expect(
      await screen.findByRole("heading", { name: t("auth:title") }),
    ).toBeInTheDocument();
  });
});
