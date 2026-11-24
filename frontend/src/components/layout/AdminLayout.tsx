import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router-dom";
import { ADMIN_SECTIONS } from "@/app/navigation";
import { cn } from "@/lib/utils";

export function AdminLayout() {
  const { t } = useTranslation();

  return (
    <div>
      <nav
        aria-label={t("admin.sections")}
        className="mb-7 flex gap-1.5 overflow-x-auto rounded-xl border bg-card p-1.5 shadow-xs"
      >
        {ADMIN_SECTIONS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                "flex flex-auto items-center justify-center gap-2 rounded-lg px-2.5 py-3 text-base font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                isActive && "bg-brand-tint font-semibold text-brand-ink",
              )
            }
          >
            <Icon className="size-[18px] shrink-0" aria-hidden="true" />
            {t(label)}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
