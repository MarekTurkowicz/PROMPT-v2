// Pieces shared by the project tabs ported in part 1 (overview, tasks, kanban, milestones, timeline).
import { useState } from "react";
import { useParams } from "react-router-dom";
import { asKey, type Task } from "@/demo/data";
import { PR_PL, defSt, gName, inPool, off, plural, projectOf, setSid, stById, stOf, visSt } from "@/demo/helpers";
import { logAudit, nextId, store, update, useDemo } from "@/demo/store";
import {
  Avatar,
  Chip,
  Due,
  LabelChips,
  PrioChip,
  Prop,
  StatusChip,
  TaskLink,
  bad,
  openConfirm,
  openForm,
  toast,
} from "@/demo/ui";

export function useProject() {
  useDemo();
  const { projectId } = useParams();
  return projectOf(projectId);
}

export const LblProp = () => (
  <Prop why="label (organization_id, name, color) i task_label (task_id, label_id) – w modelu nie ma etykiet zadań (uwaga z przeglądu makiety)." />
);

export function LabelFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="form-input lbl-f" aria-label="Filtr etykiety" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Wszystkie etykiety</option>
      {store.LABELS.map((l) => (
        <option key={l.id} value={l.id}>
          {l.name}
        </option>
      ))}
    </select>
  );
}

export function openLabelForm() {
  openForm(
    "Nowa etykieta",
    [
      { id: "name", label: "Nazwa *", value: "", required: 1, full: 1 },
      { id: "color", label: "Kolor (#RRGGBB)", value: "#6366f1" },
    ],
    "Dodaj",
    (v) => {
      const name = v.name.trim();
      const color = v.color.trim().toLowerCase();
      if (!name) return bad("Podaj nazwę etykiety.");
      if (!/^#[0-9a-f]{6}$/.test(color)) return bad("Kolor musi mieć format #RRGGBB.");
      if (store.LABELS.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
        return bad("Etykieta o tej nazwie już istnieje w organizacji.");
      }
      update((s) => {
        s.LABELS.push({ id: nextId("label"), org: s.orgId, name, color });
      });
      logAudit("create", "label", name);
      toast("Dodano etykietę „" + name + "”");
    },
  );
}

/** Port of the mock's changeStatus: validates visibility, sets the status, logs it. Returns true when changed. */
export function changeStatus(t: Task, sid: number): boolean {
  const s = stById(sid);
  const old = stOf(t);
  if (!s || !visSt(t.project).includes(s)) {
    toast("Ten status nie jest widoczny w projekcie zadania.");
    return false;
  }
  if (old && old.id === s.id) return false;
  const rec = new Set(t.assg);
  if (t.group) store.GROUPS.find((x) => x.id === t.group)?.members.forEach((u) => rec.add(u));
  rec.delete(store.ME);
  update(() => setSid(t, s.id));
  logAudit("status_changed", "task", t.title, "Status: " + (old ? old.name : "—") + " → " + s.name, {
    tid: t.id,
    pid: t.project ?? undefined,
  });
  toast(
    "Status: " + s.name + (rec.size ? " · powiadomiono " + rec.size + " " + plural(rec.size, "osobę", "osoby", "osób") : ""),
  );
  return true;
}

const PRIO_OPTIONS: [number, string][] = [1, 2, 3, 4, 5].map((i) => [i, i + " · " + PR_PL[i]]);

/** Minimal "add task" form for a project (the full form is ported elsewhere). */
export function openTaskAdd(projectId: number) {
  const vs = visSt(projectId);
  const ds = defSt();
  openForm(
    "Dodaj zadanie",
    [
      { id: "title", label: "Tytuł *", value: "", required: 1, full: 1 },
      { id: "desc", label: "Opis", type: "textarea", value: "" },
      {
        id: "sid",
        label: "Status",
        type: "select",
        options: vs.map((s) => [s.id, s.name]),
        value: ds && vs.includes(ds) ? ds.id : vs[0]?.id,
      },
      { id: "prio", label: "Priorytet", type: "select", options: PRIO_OPTIONS, value: 3 },
      { id: "start", label: "Start", type: "date", value: "" },
      { id: "due", label: "Termin", type: "date", value: "" },
      { id: "est", label: "Szacunek (h)", type: "number", value: "" },
      {
        id: "ms",
        label: "Etap",
        type: "select",
        options: [["", "— brak —"], ...store.MILES.filter((m) => m.project === projectId).map((m): [number, string] => [m.id, m.name])],
        value: "",
      },
    ],
    "Dodaj",
    (v) => {
      const start = v.start || null;
      const due = v.due || null;
      const est = v.est === "" ? null : +v.est;
      if (!v.title.trim()) return bad("Podaj tytuł zadania.");
      if (start && due && due < start) return bad("Termin nie może być wcześniejszy niż start.");
      if (est != null && !(est > 0)) return bad("Szacunek musi być większy od zera.");
      const vis = visSt(projectId);
      let sid = +v.sid;
      if (!vis.some((s) => s.id === sid)) sid = (ds && vis.includes(ds) ? ds : vis[0]).id;
      const task: Task = {
        id: nextId("task"),
        title: v.title.trim(),
        desc: v.desc.trim(),
        status: "todo",
        sid,
        prio: +v.prio,
        start,
        due,
        project: projectId,
        funding: null,
        assg: [],
        created: 0,
        est,
        author: store.ME,
        parent: null,
        ms: v.ms === "" ? null : +v.ms,
        group: null,
        tpl: null,
        pf: null,
        mand: false,
        labels: [],
      };
      setSid(task, sid);
      update((s) => {
        s.TASKS.unshift(task);
      });
      logAudit("create", "task", task.title, "", { tid: task.id, pid: projectId });
      toast("Zadanie dodane!");
    },
  );
}

/** Edit form limited to the fields the tabs need. */
export function openTaskEdit(t: Task) {
  const vs = visSt(t.project);
  openForm(
    "Edytuj zadanie",
    [
      { id: "title", label: "Tytuł *", value: t.title, required: 1, full: 1 },
      { id: "desc", label: "Opis", type: "textarea", value: t.desc },
      { id: "sid", label: "Status", type: "select", options: vs.map((s) => [s.id, s.name]), value: t.sid },
      { id: "prio", label: "Priorytet", type: "select", options: PRIO_OPTIONS, value: t.prio },
      { id: "start", label: "Start", type: "date", value: t.start ?? "" },
      { id: "due", label: "Termin", type: "date", value: t.due ?? "" },
      { id: "est", label: "Szacunek (h)", type: "number", value: t.est ?? "" },
    ],
    "Zapisz",
    (v) => {
      const start = v.start || null;
      const due = v.due || null;
      const est = v.est === "" ? null : +v.est;
      if (!v.title.trim()) return bad("Podaj tytuł zadania.");
      if (start && due && due < start) return bad("Termin nie może być wcześniejszy niż start.");
      if (est != null && !(est > 0)) return bad("Szacunek musi być większy od zera.");
      const oldDue = t.due;
      const oldSid = t.sid;
      update(() => Object.assign(t, { title: v.title.trim(), desc: v.desc.trim(), prio: +v.prio, start, due, est }));
      logAudit(
        oldDue !== due ? "rescheduled" : "update",
        "task",
        t.title,
        oldDue !== due ? "Termin: " + (oldDue || "—") + " → " + (due || "—") : "",
        { tid: t.id, pid: t.project ?? undefined },
      );
      if (oldSid !== +v.sid) changeStatus(t, +v.sid);
      else toast("Zaktualizowano zadanie");
    },
  );
}

export function deleteTask(t: Task) {
  const subs = store.TASKS.filter((x) => x.parent === t.id);
  const ref = { tid: t.id, pid: t.project ?? undefined };
  const doDel = (reason: string) => {
    const i = store.TASKS.indexOf(t);
    update((s) => {
      s.TASKS.splice(s.TASKS.indexOf(t), 1);
      subs.forEach((x) => s.TASKS.splice(s.TASKS.indexOf(x), 1));
      if (s.taskOpen === t.id || subs.some((x) => x.id === s.taskOpen)) s.taskOpen = null;
    });
    logAudit("delete", "task", t.title, reason ? "Uzasadnienie: " + reason : "", ref);
    toast("Usunięto zadanie" + (subs.length ? " i podzadania (" + subs.length + ")" : ""), {
      label: "Cofnij",
      ms: 6000,
      fn: () => {
        update((s) => {
          s.TASKS.splice(Math.min(i, s.TASKS.length), 0, t, ...subs);
        });
        logAudit("restore", "task", t.title, "", ref);
      },
    });
  };
  if (t.mand) {
    openForm(
      "Usunąć zadanie obowiązkowe?",
      [
        {
          id: "reason",
          label: "Zadanie pochodzi z obowiązkowego szablonu finansowania. Uzasadnienie trafi do dziennika zdarzeń. *",
          type: "textarea",
          value: "",
          required: 1,
        },
      ],
      "Usuń z uzasadnieniem",
      (v) => {
        const r = v.reason.trim();
        if (!r) return bad("Zadanie obowiązkowe można usunąć tylko z uzasadnieniem.");
        doDel(r);
      },
    );
    return;
  }
  openConfirm(`Usunąć zadanie „${t.title}”?${subs.length ? " Podzadania (" + subs.length + ") też zostaną usunięte." : ""}`, () => doDel(""));
}

export function takeFromPool(t: Task) {
  if (!inPool(t)) {
    toast("Zadanie z puli może wziąć tylko członek grupy.");
    return;
  }
  update((s) => {
    t.assg.push(s.ME);
    s.ASM[asKey(t.id, s.ME)] = { by: s.ME, at: off(0), start: null, end: null };
  });
  logAudit("assigned", "task", t.title, "Wzięto z puli grupy „" + gName(t.group) + "”", { tid: t.id, pid: t.project ?? undefined });
  toast("Zadanie jest teraz Twoje");
}

export function SubBlock({ subs }: { subs: Task[] }) {
  const [open, setOpen] = useState(false);
  const d = subs.filter((x) => x.status === "done").length;
  const pc = Math.round((d / subs.length) * 100);
  return (
    <div className="subs-w">
      <button type="button" className="sub-tg" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="chev" aria-hidden="true">
          ▸
        </span>
        Podzadania {d}/{subs.length}
        <span className="prog-t sub-p" aria-hidden="true">
          <i style={{ width: pc + "%", background: "#22c55e" }} />
        </span>
      </button>
      {open ? (
        <div className="subs">
          {subs.map((x) => (
            <div className="sub" key={x.id}>
              <TaskLink id={x.id}>{x.title}</TaskLink>
              <span className="row2">
                <StatusChip task={x} />
                {x.assg.map((u) => (
                  <Avatar key={u} id={u} small />
                ))}
                {!x.assg.length && x.group ? <Chip c="sky">Pula</Chip> : null}
                <Due task={x} />
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TaskMetaChips({ t }: { t: Task }) {
  return (
    <>
      <PrioChip prio={t.prio} />
      {t.mand ? <Chip c="red">Obowiązkowe</Chip> : null}
      <LabelChips task={t} />
    </>
  );
}
