import { PR_PL, plural } from "@/demo/core";
import type { Task } from "@/demo/data";
import { defSt, setSid, stById, stOf, visSt } from "@/demo/helpers";
import { logAudit, nextId, openTask, store, update } from "@/demo/store";
import { bad, openForm, toast, type FieldSpec } from "@/demo/ui";

/** Port of changeStatus: returns true when the status actually changed. */
export function changeStatus(t: Task, sid: number) {
  const s = stById(sid);
  const old = stOf(t);
  if (!s || !visSt(t.project).includes(s)) {
    toast("Ten status nie jest widoczny w projekcie zadania.");
    return false;
  }
  if (old && old.id === s.id) return false;
  update(() => setSid(t, s.id));
  const rec = new Set(t.assg);
  if (t.group) store.GROUPS.find((x) => x.id === t.group)?.members.forEach((u) => rec.add(u));
  rec.delete(store.ME);
  logAudit("status_changed", "task", t.title, "Status: " + (old ? old.name : "—") + " → " + s.name);
  toast(
    "Status: " + s.name + (rec.size ? " · powiadomiono " + rec.size + " " + plural(rec.size, "osobę", "osoby", "osób") : ""),
  );
  return true;
}

export function taskEditForm(t: Task) {
  const vs = visSt(t.project);
  const ds = defSt();
  const none: [string, string] = ["", "— brak —"];
  const fields: FieldSpec[] = [
    { id: "title", label: "Tytuł *", value: t.title, required: 1, full: 1 },
    { id: "desc", label: "Opis", type: "textarea" as const, value: t.desc },
    { id: "sid", label: "Status", type: "select" as const, options: vs.map((s) => [s.id, s.name] as [number, string]), value: t.sid },
    { id: "prio", label: "Priorytet", type: "select" as const, options: [1, 2, 3, 4, 5].map((i) => [i, i + " · " + PR_PL[i]] as [number, string]), value: t.prio },
    { id: "start", label: "Start", type: "date" as const, value: t.start ?? "" },
    { id: "due", label: "Termin", type: "date" as const, value: t.due ?? "" },
    { id: "est", label: "Szacunek (h)", type: "number" as const, value: t.est ?? "" },
    { id: "group", label: "Grupa (pula zadań)", type: "select" as const, options: [none, ...store.GROUPS.map((g) => [g.id, g.name] as [number, string])], value: t.group ?? "" },
    ...(t.project != null
      ? [{ id: "ms", label: "Etap", type: "select" as const, options: [none, ...store.MILES.filter((m) => m.project === t.project).map((m) => [m.id, m.name] as [number, string])], value: t.ms ?? "" }]
      : []),
    { id: "project", label: "Projekt", type: "select" as const, options: [none, ...store.PROJECTS.map((p) => [p.id, p.name] as [number, string])], value: t.project ?? "" },
    { id: "funding", label: "Finansowanie (przy projekcie: podpięte do projektu)", type: "select" as const, options: [none, ...store.FUNDINGS.map((x) => [x.id, x.name] as [number, string])], value: t.funding ?? "" },
  ];
  openForm("Edytuj zadanie", fields, "Zapisz", (v) => {
    const num = (x: string) => (x === "" ? null : +x);
    const d = {
      title: v.title.trim(),
      desc: v.desc.trim(),
      prio: +v.prio,
      start: v.start || null,
      due: v.due || null,
      est: num(v.est),
      group: num(v.group),
    };
    if (d.start && d.due && d.due < d.start) return bad("Termin nie może być wcześniejszy niż start.");
    if (d.est != null && !(d.est > 0)) return bad("Szacunek musi być większy od zera.");
    const project = num(v.project);
    const funding = num(v.funding);
    let pf: number | null = null;
    if (project != null && funding != null) {
      const x = store.PF.find((y) => y.project === project && y.funding === funding);
      if (!x) return bad("Zadanie projektu rozliczasz tylko z finansowania podpiętego do tego projektu.");
      pf = x.id;
    }
    const vis = visSt(project);
    let sid = +v.sid;
    if (!vis.some((s) => s.id === sid)) sid = (ds && vis.includes(ds) ? ds : vis[0]).id;
    const old = t.sid;
    const oldDue = t.due;
    update(() => {
      Object.assign(t, d, { project, funding, pf });
      if (v.ms !== undefined) t.ms = num(v.ms);
    });
    logAudit(oldDue !== d.due ? "rescheduled" : "update", "task", d.title, oldDue !== d.due ? "Termin: " + (oldDue || "—") + " → " + (d.due || "—") : "");
    if (old !== sid) changeStatus(t, sid);
    else toast("Zaktualizowano zadanie");
  });
}

export function deleteTask(t: Task) {
  const subs = store.TASKS.filter((x) => x.parent === t.id);
  const doDel = (reason: string) => {
    const i = store.TASKS.indexOf(t);
    update((s) => {
      s.TASKS.splice(i, 1);
      subs.forEach((x) => s.TASKS.splice(s.TASKS.indexOf(x), 1));
    });
    openTask(null);
    logAudit("delete", "task", t.title, reason ? "Uzasadnienie: " + reason : "", { tid: t.id, pid: t.project ?? undefined });
    toast("Usunięto zadanie" + (subs.length ? " i podzadania (" + subs.length + ")" : ""), {
      label: "Cofnij",
      ms: 6000,
      fn: () => {
        update((s) => s.TASKS.splice(Math.min(i, s.TASKS.length), 0, t, ...subs));
        logAudit("restore", "task", t.title, "", { tid: t.id, pid: t.project ?? undefined });
      },
    });
  };
  if (t.mand) {
    openForm(
      "Usunąć zadanie obowiązkowe?",
      [{ id: "reason", label: "Zadanie pochodzi z obowiązkowego szablonu finansowania. Uzasadnienie trafi do dziennika zdarzeń. *", type: "textarea", value: "", required: 1 }],
      "Usuń z uzasadnieniem",
      (v) => {
        const r = v.reason.trim();
        if (!r) return bad("Zadanie obowiązkowe można usunąć tylko z uzasadnieniem.");
        doDel(r);
      },
    );
    return;
  }
  doDel("");
}

export function addSubtask(t: Task, title: string) {
  const v = title.trim();
  if (!v) {
    toast("Podaj tytuł podzadania.");
    return false;
  }
  const vis = visSt(t.project);
  const ds = defSt();
  const n: Task = {
    id: nextId("task"),
    title: v,
    desc: "",
    status: "todo",
    sid: 0,
    prio: t.prio,
    est: null,
    start: null,
    due: t.due,
    project: t.project,
    funding: t.funding,
    pf: t.pf,
    parent: t.id,
    assg: [],
    created: 0,
    author: store.ME,
    ms: t.ms,
    group: null,
    tpl: null,
    mand: false,
    labels: [],
  };
  setSid(n, (ds && vis.includes(ds) ? ds : vis[0]).id);
  update((s) => s.TASKS.push(n));
  logAudit("create", "task", n.title, "Podzadanie zadania „" + t.title + "”", { tid: t.id, pid: t.project ?? undefined });
  return true;
}
