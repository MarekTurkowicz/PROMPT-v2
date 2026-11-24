import { Link, useParams } from "react-router-dom";
import { detachFunding, openPfForm } from "@/demo/fundingLink";
import { money, projectOf, spent } from "@/demo/helpers";
import { useDemo } from "@/demo/store";
import { Chip, EmptyState, Prop } from "@/demo/ui";

export default function FundingsTab() {
  const s = useDemo();
  const p = projectOf(useParams().projectId);
  if (!p) return null;
  const links = s.PF.filter((x) => x.project === p.id);

  return (
    <div className="mk">
      <div className="lp-head" style={{ padding: 0 }}>
        <span className="muted">Podpięcie finansowania tworzy zadania z jego szablonów.</span>
        <button type="button" className="btn-primary" onClick={() => openPfForm(p.id, null)}>
          Podepnij finansowanie
        </button>
      </div>
      {!links.length ? (
        <EmptyState title="Ten projekt nie ma finansowań" text="Podepnij grant, sponsoring albo budżet wewnętrzny." />
      ) : (
        <div className="list" style={{ margin: 0 }}>
          {links.map((x) => {
            const f = s.FUNDINGS.find((y) => y.id === x.funding);
            if (!f) return null;
            const ts = s.TASKS.filter((t) => t.pf === x.id);
            return (
              <div key={x.id} className="item">
                <div className="item-top">
                  <div>
                    <h3>
                      {f.name} {x.primary ? <Chip c="green">Główne</Chip> : null}
                    </h3>
                    <p className="desc">
                      {(f.program || "—") + " • " + (f.funder || "—")} • umowa {f.agr || "—"}
                    </p>
                    <div className="meta">
                      <Chip c="sky">{money(f.amount, f.cur)}</Chip>
                      <span className="meta-t">
                        • Alokacja: {x.a0 || "—"} → {x.a1 || "—"}
                      </span>
                      <span className="meta-t">• Na projekt: {x.alloc != null ? money(x.alloc, f.cur) : "—"}</span>
                      <Prop why="project_funding.allocated_amount – bez kwoty alokacji nie da się policzyć, ile zostało dla projektu (A1)." />
                      <span className="meta-t">• Wydatki: {money(spent(x), f.cur)}</span>
                      <span className="meta-t">• Zadania z szablonów: {ts.filter((t) => t.tpl).length}</span>
                      {f.report ? <span className="meta-t">• Raport do: {f.report}</span> : null}
                    </div>
                    {x.note ? (
                      <div className="muted" style={{ marginTop: 6 }}>
                        {x.note}
                      </div>
                    ) : null}
                  </div>
                  <div className="item-act">
                    <Link className="btn" to={`/projects/${p.id}/budget`}>
                      Budżet
                    </Link>
                    <button type="button" className="btn-danger" onClick={() => detachFunding(x)}>
                      Odepnij
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
