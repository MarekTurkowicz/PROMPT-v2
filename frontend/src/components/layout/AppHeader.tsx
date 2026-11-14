import { Menu } from "lucide-react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_API } from "@/mocks/enabled";
import { breadcrumbs } from "./breadcrumbs";
import { ThemeMenu } from "./ThemeMenu";

export function AppHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const crumbs = breadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-40 flex min-h-14 items-center gap-3 border-b bg-card px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon-lg"
        className="md:hidden"
        aria-label={t("nav.openMenu")}
        onClick={onOpenMenu}
      >
        <Menu />
      </Button>
      <nav aria-label={t("nav.breadcrumb")} className="min-w-0">
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {crumbs.map((crumb, i) => (
            <Fragment key={crumb.label}>
              {i > 0 && (
                <li aria-hidden="true" className="text-input">
                  /
                </li>
              )}
              <li className="min-w-0 truncate">
                {crumb.to && i < crumbs.length - 1 ? (
                  <Link
                    to={crumb.to}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {t(crumb.label, crumb.params)}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-semibold">
                    {t(crumb.label, crumb.params)}
                  </span>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        {MOCK_API && (
          <Badge variant="secondary" title={t("demoData.hint")}>
            {t("demoData.label")}
          </Badge>
        )}
        <ThemeMenu />
      </div>
    </header>
  );
}
