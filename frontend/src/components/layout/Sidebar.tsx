import { LogOut, Settings, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Link, NavLink, useNavigate } from "react-router-dom";
import type { ParseKeys } from "i18next";
import type { Me } from "@/api/types";
import { api } from "@/app/api";
import { MAIN_NAV } from "@/app/navigation";
import { useLogoutMutation, useMeQuery } from "@/features/auth/authApi";
import { cn } from "@/lib/utils";

function displayName(me: Me) {
  return [me.first_name, me.last_name].filter(Boolean).join(" ") || me.email;
}

function initials(me: Me) {
  const parts = displayName(me)
    .split(/[\s@.]+/)
    .filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function SidebarLink({
  to,
  labelKey,
  icon: Icon,
  onNavigate,
}: {
  to: string;
  labelKey: ParseKeys<"common">;
  icon: LucideIcon;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "relative flex items-center gap-3 rounded-lg px-3 py-2 text-base transition-colors hover:bg-sidebar-hover hover:text-sidebar-accent-foreground",
          isActive &&
            "bg-sidebar-accent font-semibold text-sidebar-accent-foreground before:absolute before:inset-y-2 before:-left-2.5 before:w-[3px] before:rounded-r before:bg-sidebar-primary",
        )
      }
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span>{t(labelKey)}</span>
    </NavLink>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { data: me } = useMeQuery();
  const [logout] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function onLogout() {
    await logout()
      .unwrap()
      .catch(() => undefined);
    dispatch(api.util.resetApiState());
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-full flex-col">
      <Link
        to="/overview"
        onClick={onNavigate}
        className="flex min-w-0 items-center gap-2.5 px-4 pt-[18px] pb-3.5"
      >
        <span
          aria-hidden="true"
          className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-primary font-semibold text-primary-foreground"
        >
          {t("appName")[0]}
        </span>
        <span className="truncate font-semibold text-sidebar-accent-foreground">
          {t("appName")}
        </span>
      </Link>

      <nav aria-label={t("nav.main")} className="grid gap-0.5 px-2.5 py-1.5">
        {MAIN_NAV.map((item) => (
          <SidebarLink
            key={item.path}
            to={`/${item.path}`}
            labelKey={item.label}
            icon={item.icon}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="flex-1" />

      <nav
        aria-label={t("nav.admin")}
        className="mt-2 grid border-t border-sidebar-border px-2.5 pt-2"
      >
        <SidebarLink
          to="/admin"
          labelKey="nav.admin"
          icon={Settings}
          onNavigate={onNavigate}
        />
      </nav>

      {me && (
        <div className="flex items-center gap-2.5 py-2.5 pr-3 pl-4">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white"
          >
            {initials(me)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-sidebar-accent-foreground">
            {displayName(me)}
          </span>
          <button
            type="button"
            onClick={onLogout}
            aria-label={t("user.logout")}
            title={t("user.logout")}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-sidebar-hover hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
