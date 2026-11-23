import { Link, useParams } from "react-router-dom";
import { PR_PL, addDays, base, fmt, fmtH, plural } from "@/demo/core";
import type { ProjectFunding, Task } from "@/demo/data";
import { CAT_KEY, defSt, fName, money, projectOf, spent, stById } from "@/demo/helpers";
import { logAudit, nextId, store, update, useDemo } from "@/demo/store";
import { Chip, EmptyState, Prop, bad, closeDialog, openConfirm, openForm, openInfo, toast } from "@/demo/ui";

/** Tasks a funding's templates would create for this attachment (nothing is stored). */
function tasksFromTemplates(pf: ProjectFunding): Task[] {
  const tps = store.TEMPL.filter((x) => x.funding === pf.funding);
  const ds = defSt();
  if (tps.some((x) => !x.status) && !ds) throw new Error("organizacja nie ma statusu domyślnego");
  return tps.map((x) => {
    const st = (x.status && stById(x.status)) || ds!;
    return {
      id: nextId("task"),
      title: x.title,
      desc: x.desc,
      prio: x.prio,
      est: x.est,
      start: pf.a0,
      due: pf.a0 && x.dueDays != null ? addDays(pf.a0, x.dueDays) : null,
      project: pf.project,
      funding: pf.funding,
      pf: pf.id,
      tpl: x.id,
      mand: true,
      assg: [],
      created: 0,
      author: store.ME,
      sid: st.id,
      status: CAT_KEY[st.cat],
      ms: null,
      group: null,
      parent: null,
      labels: [],
    };
  });
}

type Draft = Omit<ProjectFunding, "id" | "created">;

function confirmAttach(d: Draft) {
  const f = store.FUNDINGS.find((x) => x.id === d.funding)!;
  const p = store.PROJECTS.find((x) => x.id === d.project)!;
  const tps = store.TEMPL.filter((x) => x.funding === d.funding);
  const attach = () => {
    closeDialog();
    const x: ProjectFunding = { id: nextId("pf"), created: fmt(base), ...d };
    let made: Task[];
    try {
      made = tasksFromTemplates(x);
    } catch (err) {
      toast("Błąd: " + (err as Error).message + ". Nic nie zostało zapisane.");
      return;
    }
    update((s) => {
      s.PF.push(x);
      s.TASKS.push(...made);
      if (!p.funds.includes(d.funding)) p.funds.push(d.funding);
    });
    logAudit("attached", "funding", f.name, "Podpięto do projektu „" + p.name + "” · utworzono zadania: " + made.length, {
      pid: p.id,
    });
    toast("Podpięto finansowanie · utworzono zadania: " + made.length);
  };
  openInfo(
    "Podgląd: zadania z szablonów",
    <>
      <p className="m-p">
        Podpięcie „{f.name}” do projektu „{p.name}” utworzy <b>{tps.length}</b>{" "}
        {plural(tps.length, "zadanie obowiązkowe", "zadania obowiązkowe", "zadań obowiązkowych")} w jednej transakcji. Błąd
        przy którymkolwiek wycofa całość.
      </p>
      {tps.length ? (
        <ul className="feed" style={{ marginTop: 8 }}>
          {tps.map((x) => (
            <li key={x.id}>
              <b>{x.title}</b>
              <small>
                Termin: {d.a0 && x.dueDays != null ? addDays(d.a0, x.dueDays) : "—"} · priorytet {PR_PL[x.prio]} ·{" "}
                {x.est ? fmtH(x.est) : "bez szacunku"}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-s">To finansowanie nie ma szablonów zadań.</div>
      )}
      <div className="m-foot">
        <button type="button" className="btn-primary" onClick={attach}>
          Podepnij i utwórz zadania
        </button>
      </div>
    </>,
  );
}

function pfForm(pid: number) {
  openForm(
    "Podepnij finansowanie do projektu",
    [
      {
        id: "funding",
        label: "Finansowanie *",
        type: "select",
        options: store.FUNDINGS.map((f) => [f.id, f.name]),
        value: store.FUNDINGS[0]?.id,
      },
      { id: "a0", label: "Początek alokacji", type: "date", value: fmt(base) },
      { id: "a1", label: "Koniec alokacji", type: "date", value: "" },
      {
        id: "primary",
        label: "Finansowanie główne",
        type: "select",
        options: [
          ["0", "Nie"],
          ["1", "Tak"],
        ],
        value: "0",
      },
      { id: "alloc", label: "Kwota dla projektu (propozycja schematu A1)", type: "number", value: "" },
      { id: "note", label: "Notatka", type: "textarea", value: "" },
    ],
    "Dalej",
    (v) => {
      const funding = +v.funding;
      const f = store.FUNDINGS.find((x) => x.id === funding);
      const p = store.PROJECTS.find((x) => x.id === pid);
      if (!f || !p) return;
      if (store.PF.some((x) => x.project === pid && x.funding === funding)) {
        return bad("To finansowanie jest już podpięte do projektu „" + p.name + "”. Zadania nie zostały zduplikowane.");
      }
      if (v.a0 && v.a1 && v.a1 < v.a0) return bad("Koniec alokacji nie może być przed początkiem.");
      if (v.primary === "1" && store.PF.some((x) => x.project === pid && x.primary)) {
        return bad("Projekt ma już finansowanie główne – może być tylko jedno.");
      }
      const alloc = v.alloc === "" ? null : +v.alloc;
      if (
        alloc != null &&
        (!(alloc > 0) ||
          alloc + store.PF.filter((x) => x.funding === funding).reduce((a, x) => a + (x.alloc || 0), 0) > f.amount)
      ) {
        return bad("Suma alokacji nie może przekroczyć kwoty finansowania (" + money(f.amount, f.cur) + ").");
      }
      const draft: Draft = {
        project: pid,
        funding,
        a0: v.a0 || null,
        a1: v.a1 || null,
        primary: v.primary === "1",
        alloc,
        note: v.note.trim(),
      };
      // the form dialog closes itself right after submit, so open the preview afterwards
      setTimeout(() => confirmAttach(draft), 0);
    },
  );
}

function detach(x: ProjectFunding) {
  const n = store.TASKS.filter((t) => t.pf === x.id).length;
  const e = store.EXPN.filter((y) => y.pf === x.id).length;
  if (n || e) {
    toast(`Nie można odpiąć: z finansowaniem są powiązane zadania (${n}) i wydatki (${e}).`);
    return;
  }
  openConfirm(
    "Odpiąć finansowanie „" + fName(x.funding) + "” od projektu?",
    () => {
      update((s) => {
        s.PF.splice(s.PF.indexOf(x), 1);
        const p = s.PROJECTS.find((y) => y.id === x.project);
        if (p) p.funds = p.funds.filter((f) => f !== x.funding);
      });
      logAudit("detached", "funding", fName(x.funding), "Odpięto od projektu", { pid: x.project });
      toast("Odpięto finansowanie");
    },
    "Odepnij",
  );
}

export default function FundingsTab() {
  const s = useDemo();
  const p = projectOf(useParams().projectId);
  if (!p) return null;
  const links = s.PF.filter((x) => x.project === p.id);

  return (
    <div className="mk">
      <div className="lp-head" style={{ padding: 0 }}>
        <span className="muted">Podpięcie finansowania tworzy zadania z jego szablonów.</span>
        <button type="button" className="btn-primary" onClick={() => pfForm(p.id)}>
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
                    <button type="button" className="btn-danger" onClick={() => detach(x)}>
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
