import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { ADMIN_SECTIONS, MAIN_NAV, PROJECT_TABS } from "@/app/navigation";
import { setCurrentUser } from "@/mocks/db";
import { renderApp, t } from "@/test/renderApp";

const routes = [
  ...MAIN_NAV.map((n) => ({
    path: `/${n.path}`,
    label: n.label,
    issue: n.issue,
  })),
  ...PROJECT_TABS.map((tab) => ({
    path: `/projects/7/${tab.path}`,
    label: tab.label,
    issue: tab.issue,
  })),
  ...ADMIN_SECTIONS.map((s) => ({
    path: `/admin/${s.path}`,
    label: s.label,
    issue: s.issue,
  })),
];

async function currentCrumb() {
  const breadcrumb = await screen.findByRole("navigation", {
    name: t("nav.breadcrumb"),
  });
  return breadcrumb.querySelector('[aria-current="page"]');
}

describe("app routes", () => {
  beforeEach(() => setCurrentUser(2));

  it.each(routes)(
    "$path shows the placeholder of #$issue",
    async ({ path, label, issue }) => {
      renderApp(path);
      expect(
        await screen.findByRole("link", {
          name: t("placeholder.issue", { number: issue }),
        }),
      ).toHaveAttribute(
        "href",
        expect.stringMatching(new RegExp(`/issues/${issue}$`)),
      );
      expect(await currentCrumb()).toHaveTextContent(t(label));
    },
  );

  it.each([
    ["/", "nav.overview"],
    ["/projects/7", "project.tabs.overview"],
    ["/admin", "admin.members"],
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

  it("marks the projects menu item active inside a project", async () => {
    renderApp("/projects/7/kanban");
    const nav = await screen.findByRole("navigation", { name: t("nav.main") });
    expect(nav.querySelector(`a[href="/projects"]`)).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
