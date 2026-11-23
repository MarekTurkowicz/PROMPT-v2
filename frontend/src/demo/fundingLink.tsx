// Port of the mock's pfForm / pf-confirm / pf-del: attach a funding to a project (creates tasks from the funding's templates).
import { CAT_KEY, PR_PL, addDays, base, fmt, fmtH, plural } from "./core";
import type { ProjectFunding, Task } from "./data";
import { defSt, fName, money, stById } from "./helpers";
import { logAudit, nextId, store, update } from "./store";
import { bad, closeDialog, openConfirm, openForm, openInfo, toast } from "./ui";

/** Creates the mandatory tasks of a funding's templates for a new project link; throws when the organization has no default status. */
export function tasksFromTemplates(pf: ProjectFunding): Task[] {
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
      est: x.est || null,
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

interface Draft {
  project: number;
  funding: number;
  a0: string | null;
  a1: string | null;
  primary: boolean;
  alloc: number | null;
  note: string;
}

function confirmAttach(d: Draft) {
  const x: ProjectFunding = { id: nextId("pf"), created: fmt(base), ...d };
  const p = store.PROJECTS.find((y) => y.id === d.project)!;
  let made: Task[];
  update((s) => s.PF.push(x));
  try {
    made = tasksFromTemplates(x);
  } catch (err) {
    update((s) => s.PF.splice(s.PF.indexOf(x), 1));
    closeDialog();
    toast("Błąd: " + (err as Error).message + ". Nic nie zostało zapisane.");
    return;
  }
  update((s) => {
    s.TASKS.push(...made);
    if (!p.funds.includes(d.funding)) p.funds.push(d.funding);
  });
  logAudit("attached", "funding", fName(d.funding), "Podpięto do projektu „" + p.name + "” · utworzono zadania: " + made.length, { pid: p.id });
  closeDialog();
  toast("Podpięto finansowanie · utworzono zadania: " + made.length);
}

export function openPfForm(pid: number | null, fid: number | null) {
  if (!store.PROJECTS.length) {
    toast("Najpierw dodaj projekt.");
    return;
  }
  const f0 = fid != null ? store.FUNDINGS.find((f) => f.id === fid) : null;
  openForm(
    "Podepnij finansowanie do projektu",
    [
      ...(pid == null
        ? [
            {
              id: "project",
              label: "Projekt *",
              type: "select" as const,
              options: store.PROJECTS.map((p): [number, string] => [p.id, p.name]),
              value: store.PROJECTS[0].id,
            },
          ]
        : []),
      ...(fid == null
        ? [
            {
              id: "funding",
              label: "Finansowanie *",
              type: "select" as const,
              options: store.FUNDINGS.map((f): [number, string] => [f.id, f.name]),
              value: store.FUNDINGS[0]?.id,
            },
          ]
        : []),
      { id: "a0", label: "Początek alokacji", type: "date", value: fmt(base) },
      { id: "a1", label: "Koniec alokacji", type: "date", value: f0?.end || "" },
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
      const project = pid ?? +v.project;
      const funding = fid ?? +v.funding;
      const f = store.FUNDINGS.find((x) => x.id === funding);
      const p = store.PROJECTS.find((x) => x.id === project);
      if (!f || !p) return;
      if (store.PF.some((x) => x.project === project && x.funding === funding))
        return bad("To finansowanie jest już podpięte do projektu „" + p.name + "”. Zadania nie zostały zduplikowane.");
      if (v.a0 && v.a1 && v.a1 < v.a0) return bad("Koniec alokacji nie może być przed początkiem.");
      if (v.primary === "1" && store.PF.some((x) => x.project === project && x.primary))
        return bad("Projekt ma już finansowanie główne – może być tylko jedno.");
      const alloc = v.alloc === "" ? null : +v.alloc;
      if (
        alloc != null &&
        (!(alloc > 0) || alloc + store.PF.filter((x) => x.funding === funding).reduce((a, x) => a + (x.alloc || 0), 0) > f.amount)
      )
        return bad("Suma alokacji nie może przekroczyć kwoty finansowania (" + money(f.amount, f.cur) + ").");
      const draft: Draft = {
        project,
        funding,
        a0: v.a0 || null,
        a1: v.a1 || null,
        primary: v.primary === "1",
        alloc,
        note: v.note.trim(),
      };
      const tps = store.TEMPL.filter((x) => x.funding === funding);
      // The form dialog closes right after a successful submit, so show the preview on the next tick.
      setTimeout(
        () =>
          openInfo(
            "Podgląd: zadania z szablonów",
            <>
              <p className="m-p">
                Podpięcie „{f.name}” do projektu „{p.name}” utworzy <b>{tps.length}</b>{" "}
                {plural(tps.length, "zadanie obowiązkowe", "zadania obowiązkowe", "zadań obowiązkowych")} w jednej
                transakcji. Błąd przy którymkolwiek wycofa całość.
              </p>
              {tps.length ? (
                <ul className="feed" style={{ marginTop: 8 }}>
                  {tps.map((x) => (
                    <li key={x.id}>
                      <b>{x.title}</b>
                      <small>
                        Termin: {v.a0 && x.dueDays != null ? addDays(v.a0, x.dueDays) : "—"} · priorytet {PR_PL[x.prio]} ·{" "}
                        {x.est ? fmtH(x.est) : "bez szacunku"}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-s">To finansowanie nie ma szablonów zadań.</div>
              )}
              <div className="m-foot">
                <button type="button" className="btn-primary" onClick={() => confirmAttach(draft)}>
                  Podepnij i utwórz zadania
                </button>
              </div>
            </>,
          ),
        0,
      );
    },
  );
}

export function detachFunding(x: ProjectFunding) {
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
