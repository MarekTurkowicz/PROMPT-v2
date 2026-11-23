import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { ADMIN_SECTIONS, MAIN_NAV, PROJECT_TABS } from "@/app/navigation";
import { resetDemo } from "@/demo/store";
import { setCurrentUser } from "@/mocks/db";
import { renderApp, t } from "@/test/renderApp";

const routes = [
  ...MAIN_NAV.map((n) => ({ path: `/${n.path}`, label: n.label })),
  ...PROJECT_TABS.map((tab) => ({
    path: `/projects/1/${tab.path}`,
    label: tab.label,
  })),
  ...ADMIN_SECTIONS.map((s) => ({
    path: `/admin/${s.path}`,
    label: s.label,
  })),
];

async function currentCrumb() {
  const breadcrumb = await screen.findByRole("navigation", {
    name: t("nav.breadcrumb"),
  });
  return breadcrumb.querySelector('[aria-current="page"]');
}

describe("app routes", () => {
  beforeEach(() => {
    setCurrentUser(2);
    resetDemo();
  });

  it.each(routes)(
    "$path renders its screen under the right breadcrumb",
    async ({ path, label }) => {
      renderApp(path);
      await waitFor(() =>
        expect(document.querySelector("main .mk")).not.toBeNull(),
      );
      expect(await currentCrumb()).toHaveTextContent(t(label));
    },
  );

  it.each([
    ["/", "nav.overview"],
    ["/projects/1", "project.tabs.overview"],
    ["/admin", "admin.dashboard"],
  ])("%s redirects to its first screen", async (path, label) => {
    renderApp(path);
    await waitFor(async () =>
      expect(await currentCrumb()).toHaveTextContent(t(label)),
    );
  });

  it("shows the not found page for an unknown path", async () => {
    renderApp("/no-such-page");
    expect(
      await screen.findByRole("heading", { name: t("notFound.title") }),
    ).toBeInTheDocument();
  });

  it("shows the real project name and status in a project", async () => {
    renderApp("/projects/1/overview");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Portal klienta 2.0",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Aktywny").length).toBeGreaterThan(0);
  });

  it("marks the projects menu item active inside a project", async () => {
    renderApp("/projects/1/kanban");
    const nav = await screen.findByRole("navigation", { name: t("nav.main") });
    expect(nav.querySelector(`a[href="/projects"]`)).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
