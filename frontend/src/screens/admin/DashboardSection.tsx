// Port of mock.html aDash().
import { Building2, ListChecks, Users, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AL, ROLE_L, ago, type RoleCode } from "@/demo/core";
import { actorName, isOverdue, memUsers, money } from "@/demo/helpers";
import { useDemo } from "@/demo/store";
import { audTarget } from "./audit";

function Tile({ h, icon, v, s, to }: { h: string; icon: ReactNode; v: number | string; s: string; to: string }) {
  return (
    <Link className="kt-i" to={to}>
      <div className="kt-h">
        <span>{h}</span>
        {icon}
      </div>
      <div className="kt-v">{v}</div>
      <div className="kt-s">{s}</div>
    </Link>
  );
}

export default function DashboardSection() {
  const s = useDemo();
  const n = (r: RoleCode) => memUsers().filter((u) => u.role === r).length;
  const open = s.TASKS.filter((t) => t.status !== "done").length;
  const over = s.TASKS.filter(isOverdue).length;
  const tot = s.FUNDINGS.reduce((a, f) => a + f.amount, 0);
  const roleSummary = (Object.keys(ROLE_L) as RoleCode[])
    .map((r) => ({ admin: "Admin", pm: "PM", member: "Członek", viewer: "Obserwator" })[r] + " " + n(r))
    .join(" · ");
  return (
    <div className="mk">
      <header className="ah">
        <div>
          <h1>Pulpit</h1>
          <p>Podsumowanie aplikacji i ostatnie zdarzenia.</p>
        </div>
      </header>
      <div className="kt">
        <Tile h="Członkowie" icon={<Users />} v={memUsers().length} s={roleSummary} to="/admin/members" />
        <Tile
          h="Organizacje"
          icon={<Building2 />}
          v={s.ORGS.length}
          s={s.ORGS.slice(0, 2).map((o) => o.name).join(", ") + (s.ORGS.length > 2 ? " i inne" : "")}
          to="/admin/members"
        />
        <Tile h="Zadania" icon={<ListChecks />} v={s.TASKS.length} s={`Otwarte ${open} · Po terminie ${over}`} to="/tasks" />
        <Tile h="Finansowania" icon={<Wallet />} v={s.FUNDINGS.length} s={`Łącznie ${money(tot)}`} to="/fundings" />
      </div>
      <section className="card">
        <div className="dc-h">
          <h2>Ostatnia aktywność</h2>
          <Link className="lnk" to="/admin/log">
            Zobacz cały dziennik →
          </Link>
        </div>
        {s.AUD.length ? (
          <ul className="feed">
            {s.AUD.slice(0, 8).map((a) => {
              const c = AL[a.action] || ["gray", a.action];
              return (
                <li key={a.id}>
                  <div className="fi">
                    <span className={"chip " + c[0]}>{c[1]}</span>
                    <b>{audTarget(a)}</b>
                  </div>
                  <small title={a.ts.toLocaleString("pl-PL")}>
                    {actorName(a.actor)} • {ago(a.ts)}
                    {a.details ? " • " + a.details : ""}
                  </small>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="empty-s">Brak zdarzeń.</div>
        )}
      </section>
    </div>
  );
}
