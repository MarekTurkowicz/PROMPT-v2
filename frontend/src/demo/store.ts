// One mutable in-memory store for the demo screens (no backend). Mutate inside update() so React re-renders.
import { useSyncExternalStore } from "react";
import toast from "react-hot-toast";
import { PR_PL, base, dOff, fmt, parse } from "./core";
import {
  BANK_KEYS,
  BRAND0,
  buildSeed,
  type AssignmentMeta,
  type AuditEntry,
  type Bank,
  type Brand,
  type Membership,
  type Notification,
  type Org,
  type OrgSettings,
  type Seq,
  type User,
} from "./data";

export interface DemoStore extends Bank {
  USERS: User[];
  ORGS: Org[];
  MEMS: Membership[];
  ORGSET: Record<number, OrgSettings>;
  /** Task assignment metadata keyed by asKey(taskId, userId). */
  ASM: Record<string, AssignmentMeta>;
  ME: number;
  /** Current organization id. */
  orgId: number;
  /** Open task id for the task panel, or null. */
  taskOpen: number | null;
  /** Notification popover open. */
  bell: boolean;
  brand: Brand;
  /** Per-organization data; the top-level arrays above are the current one (mutate them in place, never reassign). */
  banks: Record<number, Bank>;
  seq: Seq;
}

let version = 0;
const listeners = new Set<() => void>();
const notify = () => {
  version++;
  listeners.forEach((l) => l());
};

export const store = {} as DemoStore;

function syncPrio() {
  store.ORGSET[store.orgId].prio.forEach((n, i) => {
    PR_PL[i + 1] = n;
  });
}

function load() {
  const seed = buildSeed(() => store.orgId);
  store.orgId = 1;
  Object.assign(store, {
    USERS: seed.USERS,
    ORGS: seed.ORGS,
    MEMS: seed.MEMS,
    ORGSET: seed.ORGSET,
    ASM: seed.ASM,
    ME: 2,
    taskOpen: null,
    bell: false,
    brand: { ...BRAND0 },
    banks: seed.banks,
    seq: seed.seq,
  });
  BANK_KEYS.forEach((k) => {
    (store as unknown as Record<string, unknown>)[k] = seed.banks[1][k];
  });
  syncPrio();
  runReminders();
}
export const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Subscribes the component to every store change and returns the store. Read `store.X` during render. */
export function useDemo(): DemoStore {
  useSyncExternalStore(subscribe, () => version);
  return store;
}

/** Mutate the store, then notify subscribers. */
export function update(fn: (s: DemoStore) => void) {
  fn(store);
  notify();
}

/** Next id for a new entity of the given kind. */
export const nextId = (kind: keyof Seq) => ++store.seq[kind];

export function openTask(id: number | null) {
  update((s) => {
    s.taskOpen = id;
    s.bell = false;
  });
}

/** Port of the mock's logA: audit entry for the current user/org; task entries get tid/pid by title. */
export function logAudit(
  action: string,
  entity: string,
  target: string,
  details = "",
  ref: { tid?: number; pid?: number } = {},
): AuditEntry {
  if (entity === "task" && ref.tid == null) {
    const t = store.TASKS.find((x) => x.title === target);
    if (t) ref = { tid: t.id, pid: t.project ?? undefined };
  }
  const entry: AuditEntry = {
    id: nextId("audit"),
    ts: new Date(),
    actor: store.ME,
    action,
    entity,
    target,
    details,
    org: store.orgId,
    ...ref,
  };
  store.AUD.unshift(entry);
  notify();
  return entry;
}

export function mkNotif(
  kind: Notification["kind"],
  title: string,
  text: string,
  tid: number | null,
  mins = 0,
) {
  const n: Notification = {
    id: nextId("notif"),
    org: store.orgId,
    kind,
    title,
    text,
    tid,
    ts: new Date(Date.now() - mins * 60000),
    read: false,
  };
  store.NOTIF.push(n);
  return n;
}

/** Creates "deadline tomorrow / overdue" reminders for ME once per day and task; returns how many. */
export function runReminders() {
  const tom = fmt(dOff(1));
  const today = fmt(base);
  let n = 0;
  store.TASKS.filter(
    (t) =>
      t.assg.includes(store.ME) &&
      (t.status === "todo" || t.status === "doing") &&
      t.due &&
      (t.due === tom || parse(t.due)! < base),
  ).forEach((t) => {
    if (store.NOTIF.some((x) => x.kind === "reminder" && x.tid === t.id && fmt(x.ts) === today)) return;
    const late = t.due! < today;
    mkNotif(
      "reminder",
      late ? "Termin minął" : "Termin jutro",
      t.title + " · termin " + t.due,
      t.id,
    );
    n++;
  });
  return n;
}

/** Swaps the current organization's data (arrays are shared with `banks`, nothing is copied). */
export function switchOrg(id: number) {
  if (id === store.orgId) return;
  store.orgId = id;
  BANK_KEYS.forEach((k) => {
    (store as unknown as Record<string, unknown>)[k] = store.banks[id][k];
  });
  store.taskOpen = null;
  store.bell = false;
  syncPrio();
  runReminders();
  toast("Organizacja: " + (store.ORGS.find((o) => o.id === id)?.name ?? "—"));
  notify();
}

/** Call after changing ORGSET[orgId].prio so PR_PL follows. */
export function refreshPriorities() {
  syncPrio();
  notify();
}

/** Rebuilds all seed data (for tests). */
export function resetDemo() {
  load();
  notify();
}

load();
