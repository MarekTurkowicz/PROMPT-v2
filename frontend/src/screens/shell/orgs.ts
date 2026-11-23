// Organization switching rules and creation (port of the mock's org-switch / org-new / sys-org actions).
import { PERMS, off, type RoleCode } from "@/demo/core";
import { BANK_KEYS, type Bank, type Org } from "@/demo/data";
import { memOf, myOrgs, orgName, user } from "@/demo/helpers";
import { logAudit, nextId, store, switchOrg, update } from "@/demo/store";
import { bad, openConfirm, type FieldSpec, type FormSubmit } from "@/demo/ui";

const ALL_PERMS = PERMS.map((p) => p[0]);
const ROLE_DEFS: [RoleCode, string, string[]][] = [
  ["admin", "Administrator organizacji", ALL_PERMS],
  ["pm", "Project Manager", ALL_PERMS.filter((c) => !["member.manage", "role.manage", "org.settings"].includes(c))],
  ["member", "Członek zespołu", ["project.view", "task.create", "task.edit", "time.log"]],
  ["viewer", "Obserwator", ["project.view"]],
];
const STATUS_DEFS = [
  ["todo", "Do zrobienia", "#64748b", true],
  ["in_progress", "W toku", "#f97316", false],
  ["done", "Zrobione", "#22c55e", false],
  ["cancelled", "Anulowane", "#ef4444", false],
] as const;

/** Switches organization after the confirmations the mock asks for (blocked org, pending invitation). `done` runs after the switch. */
export function requestSwitch(id: number, done: () => void) {
  const m = memOf(store.ME, id);
  const o = store.ORGS.find((x) => x.id === id);
  const go = () => {
    switchOrg(id);
    done();
  };
  if (o && !o.active) {
    openConfirm(
      `Organizacja „${o.name}” jest zablokowana. Odblokować ją?`,
      () => {
        o.active = true;
        go();
        logAudit("update", "org", o.name, "Organizacja odblokowana");
      },
      "Odblokuj",
    );
    return;
  }
  if (m && m.status === "invited") {
    openConfirm(
      `Przyjąć zaproszenie do organizacji „${orgName(id)}”? Członkostwo zmieni status na „aktywny”.`,
      () => {
        m.status = "active";
        m.joined = off(0);
        go();
        logAudit("update", "member", user(store.ME)?.email ?? "", "Członkostwo: zaproszony → aktywny");
      },
      "Przyjmij zaproszenie",
      "Później",
    );
    return;
  }
  go();
}

/** Block the current organization (confirm, then switch to another active one). */
export function requestBlockOrg(o: Org, done: () => void) {
  const next = myOrgs().find((x) => x.id !== o.id && x.active);
  if (!next) return bad("To Twoja jedyna aktywna organizacja – po blokadzie nie miałbyś gdzie pracować.");
  openConfirm(
    `Zablokować organizację „${o.name}”? Jej członkowie stracą dostęp do jej danych. Przełączę Cię do „${next.name}”.`,
    () => {
      logAudit("update", "org", o.name, "Organizacja zablokowana (is_active = false)");
      o.active = false;
      switchOrg(next.id);
      done();
    },
    "Zablokuj",
  );
}

export const NEW_ORG_FIELDS: FieldSpec[] = [
  { id: "name", label: "Nazwa *", value: "", required: 1, full: 1 },
  { id: "nip", label: "NIP (opcjonalny, unikalny)", value: "" },
  {
    id: "tz",
    label: "Strefa czasowa",
    type: "select",
    options: ["Europe/Warsaw", "Europe/London", "Europe/Berlin", "UTC", "America/New_York"].map((z) => [z, z]),
    value: "Europe/Warsaw",
  },
  {
    id: "cur",
    label: "Waluta",
    type: "select",
    options: ["PLN", "EUR", "USD", "GBP"].map((c) => [c, c]),
    value: "PLN",
  },
];

/** Creates an organization with default statuses and roles, makes ME its admin and switches to it. */
export function createOrg(v: Record<string, string>, done: () => void): ReturnType<FormSubmit> {
  const name = v.name.trim();
  const nip = v.nip.replace(/\D/g, "");
  if (!name) return bad("Nazwa organizacji jest wymagana.");
  if (nip && nip.length !== 10) return bad("NIP musi mieć 10 cyfr.");
  if (nip && Object.values(store.ORGSET).some((s) => s.nip === nip)) return bad("Ten NIP ma już inna organizacja.");

  const id = Math.max(...store.ORGS.map((o) => o.id)) + 1;
  const bank = Object.fromEntries(BANK_KEYS.map((k) => [k, []])) as unknown as Bank;
  STATUS_DEFS.forEach(([cat, n, color, def], i) =>
    bank.STATUSES.push({ id: nextId("status"), org: id, project: null, cat, name: n, color, pos: i + 1, def, active: true }),
  );
  ROLE_DEFS.forEach(([code, n, perms]) =>
    bank.ROLES.push({ id: nextId("role"), org: id, code, name: n, perms: [...perms] }),
  );
  update((s) => {
    s.ORGS.push({ id, name, active: true });
    s.ORGSET[id] = { nip, tz: v.tz, cur: v.cur, prio: ["Najniższy", "Niski", "Średni", "Wysoki", "Krytyczny"] };
    s.banks[id] = bank;
    s.MEMS.push({ org: id, user: s.ME, status: "active", job: "", joined: off(0), invited: off(0), phone: "", email: "", avatar: "" });
    const me = user(s.ME);
    if (me) me.roles[id] = "admin";
  });
  switchOrg(id);
  done();
  logAudit("create", "org", name, "Statusy: 4 (1 domyślny) · role: 4 · Twoja rola: administrator organizacji");
  return undefined;
}
