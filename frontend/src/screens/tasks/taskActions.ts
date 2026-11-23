// Task mutations shared by the list, the form and (later) other screens. Ports of the mock's changeStatus / pool-take / task-del.
import { asKey } from "@/demo/data";
import type { Task } from "@/demo/data";
import { base, fmt, plural } from "@/demo/core";
import { gName, inPool, setSid, stById, stOf, visSt } from "@/demo/helpers";
import { logAudit, store, update } from "@/demo/store";
import { bad, openForm, toast } from "@/demo/ui";

/** Moves a task to another status of its project; returns true when something changed. */
export function changeStatus(t: Task, sid: number): boolean {
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
  logAudit("status_changed", "task", t.title, "Status: " + (old ? old.name : "—") + " → " + s.name, { tid: t.id, pid: t.project ?? undefined });
  toast("Status: " + s.name + (rec.size ? " · powiadomiono " + rec.size + " " + plural(rec.size, "osobę", "osoby", "osób") : ""));
  return true;
}

export function takeFromPool(t: Task) {
  if (!inPool(t)) {
    toast("Zadanie z puli może wziąć tylko członek grupy.");
    return;
  }
  update((s) => {
    t.assg.push(s.ME);
    s.ASM[asKey(t.id, s.ME)] = { by: s.ME, at: fmt(base), start: null, end: null };
  });
  logAudit("assigned", "task", t.title, "Wzięto z puli grupy „" + gName(t.group) + "”", { tid: t.id, pid: t.project ?? undefined });
  toast("Zadanie jest teraz Twoje");
}

export function deleteTask(t: Task) {
  const subs = store.TASKS.filter((x) => x.parent === t.id);
  const doDel = (reason: string) => {
    const i = store.TASKS.indexOf(t);
    update((s) => {
      s.TASKS.splice(i, 1);
      subs.forEach((x) => s.TASKS.splice(s.TASKS.indexOf(x), 1));
      if (s.taskOpen === t.id || subs.some((x) => x.id === s.taskOpen)) s.taskOpen = null;
    });
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
  doDel("");
}
