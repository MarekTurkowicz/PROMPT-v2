import type { ParseKeys } from "i18next";
import { ADMIN_SECTIONS, MAIN_NAV, PROJECT_TABS } from "@/app/navigation";

export type Crumb = {
  label: ParseKeys<"common">;
  params?: Record<string, string>;
  to?: string;
};

export function breadcrumbs(pathname: string): Crumb[] {
  const [area, id, tab] = pathname.split("/").filter(Boolean);

  if (area === "projects" && id) {
    const current = PROJECT_TABS.find((t) => t.path === tab) ?? PROJECT_TABS[0];
    return [
      { label: "nav.projects", to: "/projects" },
      {
        label: "project.title",
        params: { id },
        to: `/projects/${id}/overview`,
      },
      { label: current.label },
    ];
  }

  if (area === "admin") {
    const current =
      ADMIN_SECTIONS.find((s) => s.path === id) ?? ADMIN_SECTIONS[0];
    return [{ label: "nav.admin", to: "/admin" }, { label: current.label }];
  }

  const main = MAIN_NAV.find((n) => n.path === area);
  return main ? [{ label: main.label }] : [];
}
