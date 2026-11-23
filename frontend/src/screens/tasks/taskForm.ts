// Port of the mock's taskForm(t, ctx): add / edit task dialog.
import { PR_PL } from "@/demo/core";
import type { Task } from "@/demo/data";
import { defSt, fName, setSid, visSt } from "@/demo/helpers";
import { logAudit, nextId, store, update } from "@/demo/store";
import { bad, openForm, toast, type FieldSpec } from "@/demo/ui";
import { changeStatus } from "./taskActions";

export interface TaskFormCtx {
  project?: number;
  funding?: number;
}

const none: [string, string] = ["", "— brak —"];

export function openTaskForm(t?: Task | null, ctx: TaskFormCtx = {}) {
  const lock = ctx.project != null || ctx.funding != null;
  const pid = t ? t.project : (ctx.project ?? null);
  const vs = visSt(pid);
  const ds = defSt();
  const f: FieldSpec[] = [
    { id: "title", label: "Tytuł *", value: t?.title || "", required: 1, full: 1 },
    { id: "desc", label: "Opis", type: "textarea", value: t?.desc || "" },
    {
      id: "sid",
      label: "Status",
      type: "select",
      options: vs.map((s) => [s.id, s.name]),
      value: t ? t.sid : ds && vs.includes(ds) ? ds.id : vs[0]?.id,
    },
    {
      id: "prio",
      label: "Priorytet",
      type: "select",
      options: [1, 2, 3, 4, 5].map((i) => [i, i + " · " + PR_PL[i]]),
      value: t?.prio || 3,
    },
    { id: "start", label: "Start", type: "date", value: t?.start || "" },
    { id: "due", label: "Termin", type: "date", value: t?.due || "" },
    { id: "est", label: "Szacunek (h)", type: "number", value: t?.est ?? "" },
    {
      id: "group",
      label: "Grupa (pula zadań)",
      type: "select",
      options: [none, ...store.GROUPS.map((g): [number, string] => [g.id, g.name])],
      value: t?.group ?? "",
    },
  ];
  if (pid != null) {
    f.push({
      id: "ms",
      label: "Etap",
      type: "select",
      options: [none, ...store.MILES.filter((m) => m.project === pid).map((m): [number, string] => [m.id, m.name])],
      value: t?.ms ?? "",
    });
  }
  if (!lock) {
    f.push(
      {
        id: "project",
        label: "Projekt",
        type: "select",
        options: [none, ...store.PROJECTS.map((p): [number, string] => [p.id, p.name])],
        value: t?.project ?? "",
      },
      {
        id: "funding",
        label: "Finansowanie (przy projekcie: podpięte do projektu)",
        type: "select",
        options: [none, ...store.FUNDINGS.map((x): [number, string] => [x.id, x.name])],
        value: t?.funding ?? "",
      },
    );
  } else if (ctx.project != null && store.PF.some((x) => x.project === ctx.project)) {
    f.push({
      id: "pf",
      label: "Rozliczane z finansowania",
      type: "select",
      options: [none, ...store.PF.filter((x) => x.project === ctx.project).map((x): [number, string] => [x.id, fName(x.funding)])],
      value: "",
    });
  }

  openForm(t ? "Edytuj zadanie" : "Dodaj zadanie", f, t ? "Zapisz" : "Dodaj", (v) => {
    const d: Partial<Task> = {
      title: v.title.trim(),
      desc: v.desc.trim(),
      prio: +v.prio,
      start: v.start || null,
      due: v.due || null,
      est: v.est === "" ? null : +v.est,
      group: v.group === "" ? null : +v.group,
    };
    if (v.ms !== undefined) d.ms = v.ms === "" ? null : +v.ms;
    if (d.start && d.due && d.due < d.start) return bad("Termin nie może być wcześniejszy niż start.");
    if (d.est != null && !(d.est > 0)) return bad("Szacunek musi być większy od zera.");
    if (!lock) {
      d.project = v.project === "" ? null : +v.project;
      d.funding = v.funding === "" ? null : +v.funding;
      d.pf = null;
      if (d.project != null && d.funding != null) {
        const x = store.PF.find((y) => y.project === d.project && y.funding === d.funding);
        if (!x) return bad("Zadanie projektu rozliczasz tylko z finansowania podpiętego do tego projektu.");
        d.pf = x.id;
      }
    } else if (v.pf !== undefined) {
      d.pf = v.pf === "" ? null : +v.pf;
      d.funding = d.pf ? (store.PF.find((x) => x.id === d.pf)?.funding ?? null) : null;
    }
    const pr = lock ? pid : (d.project ?? null);
    const vis = visSt(pr);
    let sid = +v.sid;
    if (!vis.some((s) => s.id === sid)) {
      const s0 = ds && vis.includes(ds) ? ds : vis[0];
      if (!s0) return bad("Projekt nie ma żadnego widocznego statusu.");
      sid = s0.id;
    }
    if (t) {
      const old = t.sid;
      const oldDue = t.due;
      update(() => Object.assign(t, d));
      logAudit(
        oldDue !== d.due ? "rescheduled" : "update",
        "task",
        d.title!,
        oldDue !== d.due ? "Termin: " + (oldDue || "—") + " → " + (d.due || "—") : "",
        { tid: t.id, pid: t.project ?? undefined },
      );
      if (old !== sid) changeStatus(t, sid);
      else toast("Zaktualizowano zadanie");
    } else {
      const n: Task = {
        id: nextId("task"),
        title: "",
        desc: "",
        status: "todo",
        sid,
        prio: 3,
        start: null,
        due: null,
        est: null,
        assg: [],
        created: 0,
        author: store.ME,
        parent: null,
        ms: null,
        tpl: null,
        pf: null,
        mand: false,
        labels: [],
        group: null,
        project: ctx.project ?? null,
        funding: ctx.funding ?? null,
        ...d,
      };
      setSid(n, sid);
      update((s) => s.TASKS.unshift(n));
      logAudit("create", "task", n.title, "", { tid: n.id, pid: n.project ?? undefined });
      toast("Zadanie dodane!");
    }
  });
}
