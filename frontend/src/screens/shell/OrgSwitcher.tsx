// Port of mock.html orgNav(): organization switcher under the sidebar brand.
import { Building2, ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { memOf, myOrgs, orgName } from "@/demo/helpers";
import { useDemo } from "@/demo/store";
import { openForm, toast } from "@/demo/ui";
import { cn } from "@/lib/utils";
import { NEW_ORG_FIELDS, createOrg, requestSwitch } from "./orgs";

export function OrgSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const s = useDemo();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const afterSwitch = () => {
    navigate("/overview");
    onNavigate?.();
  };
  const item =
    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-sidebar-hover hover:text-sidebar-accent-foreground";
  const letter = "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold";

  return (
    <div ref={ref} className="px-2.5 pb-1.5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="orglist"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border px-2.5 py-2 text-left hover:bg-sidebar-hover"
      >
        <Building2 className="size-5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <small className="block text-xs">Organizacje</small>
          <b className="block truncate text-sm font-semibold text-sidebar-accent-foreground">{orgName(s.orgId)}</b>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <ul id="orglist" className="mt-1 grid gap-0.5">
          {myOrgs().map((o) => {
            const on = o.id === s.orgId;
            const m = memOf(s.ME, o.id);
            return (
              <li key={o.id}>
                <button
                  type="button"
                  aria-current={on || undefined}
                  className={cn(item, on && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground")}
                  onClick={() => {
                    setOpen(false);
                    if (!on) requestSwitch(o.id, afterSwitch);
                  }}
                >
                  <i aria-hidden="true" className={cn(letter, "bg-sidebar-accent not-italic")}>
                    {o.name[0]}
                  </i>
                  <span className="min-w-0 flex-1 truncate">{o.name}</span>
                  {!o.active ? (
                    <em className="text-xs not-italic text-red-300">zablokowana</em>
                  ) : m?.status === "invited" ? (
                    <em className="text-xs not-italic">zaproszenie</em>
                  ) : null}
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              className={item}
              onClick={() => {
                setOpen(false);
                openForm("Nowa organizacja", NEW_ORG_FIELDS, "Załóż organizację", (v) =>
                  createOrg(v, () => {
                    afterSwitch();
                    toast("Założono organizację „" + v.name.trim() + "”");
                  }),
                );
              }}
            >
              <i aria-hidden="true" className={cn(letter, "border border-dashed")}>
                <Plus className="size-3.5" />
              </i>
              <span>Nowa organizacja</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
