import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { AppHeader } from "./AppHeader";
import { SidebarContent } from "./Sidebar";

export function AppShell() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="grid min-h-dvh md:grid-cols-[252px_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg border-2 border-primary bg-card px-3.5 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {t("skipToContent")}
      </a>

      <aside className="sticky top-0 hidden h-dvh overflow-y-auto bg-sidebar text-sidebar-foreground md:block">
        <SidebarContent />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[252px] gap-0 overflow-y-auto border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">{t("nav.main")}</SheetTitle>
          <SheetClose
            aria-label={t("nav.closeMenu")}
            className="absolute top-4 right-3 flex size-9 items-center justify-center rounded-lg hover:bg-sidebar-hover hover:text-sidebar-accent-foreground"
          >
            <X className="size-5" aria-hidden="true" />
          </SheetClose>
          <SidebarContent onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-col">
        <AppHeader onOpenMenu={() => setMenuOpen(true)} />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 p-4 focus:outline-none md:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
