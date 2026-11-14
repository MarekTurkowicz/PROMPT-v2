import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { PROJECT_TABS } from "@/app/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProjectLayout() {
  const { t } = useTranslation();
  const { projectId = "" } = useParams();

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold">
          {t("project.title", { id: projectId })}
        </h1>
        <Button variant="outline" size="lg" asChild>
          <Link to="/projects">{t("project.backToList")}</Link>
        </Button>
      </header>
      <nav
        aria-label={t("project.sections")}
        className="flex overflow-x-auto border-b"
      >
        {PROJECT_TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              cn(
                "-mb-px border-b-2 border-transparent px-2 py-2 text-sm whitespace-nowrap text-muted-foreground hover:border-input hover:text-foreground",
                isActive && "border-primary font-semibold text-brand-ink",
              )
            }
          >
            {t(tab.label)}
          </NavLink>
        ))}
      </nav>
      <section>
        <Outlet />
      </section>
    </div>
  );
}
