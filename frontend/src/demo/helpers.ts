// Pure-ish helpers from the mock that two or more screens use. They read the current store at call time.
import {
  ATT_OK,
  MAX_ATT,
  PS_PL,
  base,
  clamp,
  dBetween,
  fmtH,
  parse,
  plural,
  type RoleCode,
} from "./core";
import type { Group, Milestone, Project, ProjectFunding, Role, RoleAssignment, Status, Task } from "./data";
import { store } from "./store";

export * from "./core";

/** Validation message for an uploaded file (type and size), empty when fine. */
export function attErr(f: { name: string; size: number }): string {
  const ext = f.name.split(".").pop()!.toLowerCase();
  if (!ATT_OK.includes(ext)) return "Niedozwolony typ pliku. Dozwolone: " + ATT_OK.join(", ") + ".";
  if (f.size <= 0 || f.size > MAX_ATT) return "Plik musi mieć od 1 B do 50 MB.";
  return "";
}

/* ---- lookups ---- */
export const user = (id: number | null | undefined) => store.USERS.find((u) => u.id === id);
export const uname = (u: { first?: string; last?: string; email: string }) =>
  u.first && u.last ? u.first + " " + u.last : u.email;
export const initials = (u: { first?: string; last?: string; email: string }) =>
  (u.first ? u.first[0] + (u.last ? u.last[0] : "") : u.email.slice(0, 2)).toUpperCase();
export const actorName = (id: number | null | undefined) => {
  const u = user(id);
  return u ? uname(u) : "Usunięty użytkownik";
};
export const pName = (id: number | null | undefined) => store.PROJECTS.find((p) => p.id === id)?.name ?? "";
export const fName = (id: number | null | undefined) => store.FUNDINGS.find((f) => f.id === id)?.name ?? "";
export const orgName = (id: number) => store.ORGS.find((o) => o.id === id)?.name ?? "—";
export const msName = (id: number | null) => store.MILES.find((m) => m.id === id)?.name ?? "—";
export const gName = (id: number | null) => store.GROUPS.find((g) => g.id === id)?.name ?? "—";
export const tt = (title: string) => store.TASKS.find((t) => t.title === title);
export const tasksOf = (pid: number) => store.TASKS.filter((t) => t.project === pid);
export const projectOf = (id: number | string | undefined) => store.PROJECTS.find((p) => p.id === Number(id));
export const curOrg = () => store.ORGSET[store.orgId]?.cur ?? "PLN";
export const money = (n: number, c?: string) => new Intl.NumberFormat("pl-PL").format(n) + " " + (c || curOrg());
export const projStatusLabel = (p: Project) => PS_PL[p.status];

/* ---- tasks and statuses ---- */
export const isOverdue = (t: Task) =>
  (t.status === "todo" || t.status === "doing") && !!t.due && parse(t.due)! < base;
export const isDueSoon = (t: Task) => {
  if (t.status === "done" || t.status === "cancelled" || !t.due) return false;
  const n = dBetween(base, parse(t.due)!);
  return n >= 0 && n <= 7;
};
export const OPEN = (t: Task) => t.status === "todo" || t.status === "doing";
export const estH = (t: Task) => (t.est != null ? t.est : 4);
export const stOf = (t: Task) => store.STATUSES.find((s) => s.id === t.sid);
export const stById = (id: number | string) => store.STATUSES.find((s) => s.id === +id);
export const defSt = () =>
  store.STATUSES.find((s) => s.def && s.project == null && s.org === store.orgId);
/** Statuses a project can use: org-wide (minus hidden) plus its own, sorted by position. */
export function visSt(pid: number | null): Status[] {
  const p = store.PROJECTS.find((x) => x.id === pid);
  const hid = (p && p.hidden) || [];
  return store.STATUSES.filter(
    (s) =>
      s.org === store.orgId &&
      s.active &&
      (s.project == null ? !hid.includes(s.id) : s.project === pid),
  ).sort((a, b) => a.pos - b.pos || a.id - b.id);
}
/** Sets a task's status and keeps the category key `status` in sync. */
export function setSid(t: Task, sid: number) {
  t.sid = sid;
  const s = stOf(t);
  if (s) t.status = ({ todo: "todo", in_progress: "doing", done: "done", cancelled: "cancelled" } as const)[s.cat];
}
export const topLevel = (list: Task[]) => {
  const ids = new Set(list.map((t) => t.id));
  return list.filter((t) => !t.parent || !ids.has(t.parent));
};
export const lblOf = (t: Task) =>
  (t.labels || []).map((id) => store.LABELS.find((l) => l.id === id)).filter((l) => !!l);
export const hasLbl = (t: Task, id: number | string) => !id || (t.labels || []).includes(+id);

/* ---- members, groups, roles ---- */
export const memOf = (uid: number, org = store.orgId) =>
  store.MEMS.find((m) => m.user === uid && m.org === org);
export const memUsers = () => store.USERS.filter((u) => memOf(u.id));
export const activeMem = (uid: number) =>
  memOf(uid)?.status === "active" && user(uid)?.active !== false;
export const myOrgs = () =>
  store.ORGS.filter((o) =>
    store.MEMS.some((m) => m.org === o.id && m.user === store.ME && m.status !== "left" && m.status !== "suspended"),
  );
export function ancestors(g: Group) {
  const out: Group[] = [];
  const seen = new Set([g.id]);
  let c: Group | undefined = g;
  while (c && c.parent && !seen.has(c.parent)) {
    seen.add(c.parent);
    c = store.GROUPS.find((x) => x.id === c!.parent);
    if (c) out.push(c);
  }
  return out;
}
export const myGroups = (uid = store.ME) => store.GROUPS.filter((g) => g.members.includes(uid));
/** Unassigned task of one of my groups that is still open. */
export const inPool = (t: Task) =>
  t.group != null && !t.assg.length && OPEN(t) && store.GROUPS.some((g) => g.id === t.group && g.members.includes(store.ME));
export const roleBy = (code: RoleCode, org = store.orgId) =>
  store.ROLES.find((r) => r.org === org && r.code === code);
export const roleId = (id: number | undefined) => store.ROLES.find((r) => r.id === id);
/** Explicit assignments plus one derived row per active/invited member for their membership role. */
export function assignRows(): RoleAssignment[] {
  return [
    ...memUsers()
      .filter((u) => ["active", "invited"].includes(memOf(u.id)!.status))
      .map((u) => ({ id: "u" + u.id, role: roleBy(u.role)?.id, member: u.id, group: null, project: null, derived: true })),
    ...store.ASSIGN,
  ];
}
/** Roles a person effectively has (in a project): where each one comes from and its scope. */
export function effRoles(uid: number, pid: number | null) {
  if (!activeMem(uid)) return [];
  const src = new Map<number, string>();
  myGroups(uid).forEach((g) => {
    src.set(g.id, "grupa „" + g.name + "”");
    ancestors(g).forEach((a) => {
      if (!src.has(a.id)) src.set(a.id, "grupa nadrzędna „" + a.name + "” (przez „" + g.name + "”)");
    });
  });
  const out: { r: Role; from: string; scope: string }[] = [];
  assignRows().forEach((a) => {
    if (a.project != null && a.project !== pid) return;
    const from = a.member === uid ? "nadana osobie" : a.group != null && src.has(a.group) ? src.get(a.group)! : null;
    const r = roleId(a.role);
    if (from && r) out.push({ r, from, scope: a.project != null ? "projekt „" + pName(a.project) + "”" : "cała organizacja" });
  });
  return out;
}

/* ---- progress, money ---- */
export function msProg(m: Milestone) {
  const ts = store.TASKS.filter((t) => t.ms === m.id && t.status !== "cancelled");
  const d = ts.filter((t) => t.status === "done").length;
  return { n: ts.length, d, pct: ts.length ? Math.round((d / ts.length) * 100) : 0 };
}
/** Sum of expenses booked on a project-funding link. */
export const spent = (x: ProjectFunding) =>
  store.EXPN.filter((e) => e.pf === x.id).reduce((a, e) => a + e.amount, 0);
export function fundUse(f: { id: number; amount: number }) {
  const sp = store.PF.filter((x) => x.funding === f.id).reduce((a, x) => a + spent(x), 0);
  return { sp, pc: f.amount ? Math.min(100, Math.round((sp / f.amount) * 100)) : 0 };
}
export function projStats(p: Project) {
  const ts = store.TASKS.filter((t) => t.project === p.id && t.status !== "cancelled");
  const d = ts.filter((t) => t.status === "done").length;
  const pct = ts.length ? Math.round((d / ts.length) * 100) : 0;
  const ps = parse(p.start);
  const pe = parse(p.end);
  let tp: number | null = null;
  if (ps && pe && pe > ps) {
    const tot = dBetween(ps, pe);
    const cl = base > pe ? pe : base < ps ? ps : base;
    tp = Math.round((clamp(dBetween(ps, cl), 0, tot) / tot) * 100);
  }
  const links = store.PF.filter((x) => x.project === p.id);
  const bud = links.reduce(
    (a, x) => a + (x.alloc != null ? x.alloc : store.FUNDINGS.find((f) => f.id === x.funding)?.amount || 0),
    0,
  );
  const sp = links.reduce((a, x) => a + spent(x), 0);
  return {
    n: ts.length,
    d,
    pct,
    /** Share of the project's time already elapsed. */
    tp,
    over: ts.filter(isOverdue).length,
    /** Budget used, %. */
    bp: bud ? Math.round((sp / bud) * 100) : null,
    ppl: Array.from(new Set(ts.filter((t) => t.status !== "done").flatMap((t) => t.assg))),
  };
}
export type ProjStats = ReturnType<typeof projStats>;

/* ---- team workload ---- */
export function workload(p: { id: number }) {
  const ts = store.TASKS.filter((t) => t.project === p.id && OPEN(t));
  const ppl = memUsers()
    .filter((u) => activeMem(u.id) || ts.some((t) => t.assg.includes(u.id)))
    .map((u) => {
      const mine = ts.filter((t) => t.assg.includes(u.id));
      return {
        u,
        ts: mine,
        n: mine.length,
        h: mine.reduce((a, t) => a + estH(t), 0),
        over: mine.filter(isOverdue).length,
        inact: !activeMem(u.id),
        hot: false,
      };
    });
  const act = ppl.filter((x) => !x.inact);
  const avg = act.length ? act.reduce((a, x) => a + x.h, 0) / act.length : 0;
  ppl.forEach((x) => {
    x.hot = !x.inact && x.n >= 3 && x.h > avg * 1.3;
  });
  return { ts, ppl, avg, unas: ts.filter((t) => !t.assg.length) };
}
export type Workload = ReturnType<typeof workload>;
/** Reassignment suggestions; `opts.skip` holds `taskId:userId` pairs the user dismissed. */
export function wlRecs(W: Workload, opts: { ai: boolean; skip: string[] }) {
  if (!opts.ai) return [];
  const load = new Map(W.ppl.map((x) => [x.u.id, x.h]));
  const act = W.ppl.filter((x) => !x.inact);
  const recs: { t: Task; from: number; to: number; why: string; after: string }[] = [];
  W.ppl
    .filter((x) => x.hot || (x.inact && x.n))
    .sort((a, b) => b.h - a.h)
    .forEach((x) => {
      const t = x.ts
        .filter((t) => t.status === "todo" && !opts.skip.includes(t.id + ":" + x.u.id))
        .sort((a, b) => a.prio - b.prio || estH(a) - estH(b))[0];
      if (!t) return;
      const to = act
        .filter((y) => y.u.id !== x.u.id && !t.assg.includes(y.u.id))
        .sort((a, b) => load.get(a.u.id)! - load.get(b.u.id)!)[0];
      if (!to) return;
      const toH = load.get(to.u.id)!;
      load.set(x.u.id, load.get(x.u.id)! - estH(t));
      load.set(to.u.id, toH + estH(t));
      recs.push({
        t,
        from: x.u.id,
        to: to.u.id,
        why: x.inact
          ? uname(x.u) + " ma zawieszone członkostwo"
          : uname(x.u) + ": " + fmtH(x.h) + " w " + x.n + " " + plural(x.n, "zadaniu", "zadaniach", "zadaniach") + " (średnio " + fmtH(Math.round(W.avg)) + ")",
        after: uname(to.u) + " ma " + fmtH(toH) + ", po zmianie " + fmtH(toH + estH(t)),
      });
    });
  return recs.slice(0, 3);
}
