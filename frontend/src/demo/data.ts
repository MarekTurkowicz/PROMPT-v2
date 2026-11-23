// Faithful port of the mock-up's seed data and its post-processing. Field names follow the mock.
import {
  CAT_KEY,
  PERMS,
  addDays,
  base,
  dOff,
  mulberry,
  off,
  parse,
  type FundingType,
  type ProjectStatus,
  type RoleCode,
  type StatusCat,
  type TaskCat,
} from "./core";

export interface User {
  id: number;
  first: string;
  last: string;
  email: string;
  phone: string;
  org: number;
  active: boolean;
  /** Role per organization id; `role` reads the one of the current organization. */
  roles: Record<number, RoleCode>;
  role: RoleCode;
}
export interface Org {
  id: number;
  name: string;
  active: boolean;
}
export interface OrgSettings {
  nip: string;
  tz: string;
  cur: string;
  /** Names of priorities 1..5. */
  prio: string[];
}
export interface Membership {
  org: number;
  user: number;
  status: "invited" | "active" | "suspended" | "left";
  job: string;
  joined: string | null;
  invited: string;
  phone: string;
  email: string;
  avatar: string;
}
export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  start: string | null;
  end: string | null;
  owner: number;
  /** Ids of linked fundings (legacy; real links are in ProjectFunding). */
  funds: number[];
  /** Ids of hidden org-wide statuses. */
  hidden: number[];
  /** Days relative to today. */
  created: number;
  updated: number;
}
export interface Funding {
  id: number;
  name: string;
  program: string;
  funder: string;
  amount: number;
  type: FundingType;
  start: string | null;
  end: string | null;
  created: number;
  cur: string;
  /** Agreement number. */
  agr: string;
  /** Report due date. */
  report: string | null;
  desc: string;
}
export interface Task {
  id: number;
  title: string;
  desc: string;
  /** Category key derived from the status `sid`. */
  status: TaskCat;
  sid: number;
  /** Priority 1..5. */
  prio: number;
  start: string | null;
  due: string | null;
  project: number | null;
  funding: number | null;
  /** Assignee user ids. */
  assg: number[];
  /** Days relative to today. */
  created: number;
  /** Estimate in hours. */
  est: number | null;
  author: number;
  parent: number | null;
  /** Milestone id. */
  ms: number | null;
  /** Group id (task pool). */
  group: number | null;
  /** Template id the task came from. */
  tpl: number | null;
  /** ProjectFunding id the task is settled against. */
  pf: number | null;
  /** Mandatory (from a funding template). */
  mand: boolean;
  labels: number[];
}
export interface Status {
  id: number;
  org: number;
  project: number | null;
  cat: StatusCat;
  name: string;
  color: string;
  pos: number;
  def: boolean;
  active: boolean;
}
export interface Group {
  id: number;
  org: number;
  parent: number | null;
  name: string;
  desc: string;
  members: number[];
  created: string;
}
export interface Role {
  id: number;
  org: number;
  code: RoleCode | null;
  name: string;
  perms: string[];
}
export interface RoleAssignment {
  id: number | string;
  org?: number;
  role: number | undefined;
  member: number | null;
  group: number | null;
  project: number | null;
  created?: string;
  /** Computed rows from membership roles (see assignRows). */
  derived?: boolean;
}
export interface Milestone {
  id: number;
  project: number;
  name: string;
  status: "planned" | "active" | "done";
  due: string | null;
  pos: number;
}
export interface ProjectFunding {
  id: number;
  project: number;
  funding: number;
  /** Allocation start / end. */
  a0: string | null;
  a1: string | null;
  primary: boolean;
  alloc: number | null;
  note: string;
  created: string | null;
}
export interface TaskTemplate {
  id: number;
  funding: number;
  title: string;
  desc: string;
  prio: number;
  est: number;
  dueDays: number | null;
  /** Status id; null = organization default. */
  status: number | null;
}
export interface FileRef {
  name: string;
  size: number;
}
export interface Expense {
  id: number;
  project: number;
  pf: number | null;
  task: number | null;
  type: string;
  amount: number;
  cur: string;
  date: string | null;
  doc: string;
  desc: string;
  by: number;
  att: FileRef[];
}
export interface TimeEntry {
  id: number;
  task: number;
  user: number;
  hours: number;
  date: string | null;
  note: string;
  created: string | null;
}
export interface Comment {
  id: number;
  task: number | null;
  project: number | null;
  author: number;
  text: string;
  ts: Date;
  parent: number | null;
  att: FileRef[];
}
export interface ChecklistItem {
  id: number;
  task: number;
  list: string;
  text: string;
  order: number;
  assignee: number | null;
  doneBy: number | null;
  doneAt: Date | null;
}
export interface Attachment {
  id: number;
  task: number;
  name: string;
  size: number;
  by: number;
  ts: Date;
}
export interface Label {
  id: number;
  org: number;
  name: string;
  color: string;
}
export interface Notification {
  id: number;
  org: number;
  kind: "activity" | "reminder";
  title: string;
  text: string;
  tid: number | null;
  ts: Date;
  read: boolean;
}
export interface AuditEntry {
  id: number;
  ts: Date;
  actor: number;
  action: string;
  entity: string;
  target: string;
  details: string;
  org?: number;
  tid?: number;
  pid?: number;
}
/** Task assignment metadata, keyed by `asKey(task, user)`. */
export interface AssignmentMeta {
  by: number;
  at: string | null;
  start: string | null;
  end: string | null;
  /** Taken from a group's task pool. */
  pool?: boolean;
}
export interface Brand {
  name: string;
  tag: string;
  accent: string;
  nav: string;
  logo: string | null;
}

/** Everything that exists once per organization. */
export interface Bank {
  PROJECTS: Project[];
  FUNDINGS: Funding[];
  TASKS: Task[];
  AUD: AuditEntry[];
  STATUSES: Status[];
  ROLES: Role[];
  GROUPS: Group[];
  ASSIGN: RoleAssignment[];
  MILES: Milestone[];
  PF: ProjectFunding[];
  TEMPL: TaskTemplate[];
  EXPN: Expense[];
  TIME: TimeEntry[];
  COMS: Comment[];
  CHECK: ChecklistItem[];
  ATT: Attachment[];
  NOTIF: Notification[];
  LABELS: Label[];
}
export const BANK_KEYS: (keyof Bank)[] = [
  "PROJECTS",
  "FUNDINGS",
  "TASKS",
  "AUD",
  "STATUSES",
  "ROLES",
  "GROUPS",
  "ASSIGN",
  "MILES",
  "PF",
  "TEMPL",
  "EXPN",
  "TIME",
  "COMS",
  "CHECK",
  "ATT",
  "NOTIF",
  "LABELS",
];

/** Id counters (last used id) so screens can create new entities. */
export type Seq = Record<
  | "project"
  | "funding"
  | "user"
  | "task"
  | "status"
  | "group"
  | "role"
  | "assign"
  | "milestone"
  | "template"
  | "pf"
  | "expense"
  | "time"
  | "comment"
  | "check"
  | "attachment"
  | "label"
  | "notif"
  | "audit"
  | "org",
  number
>;

export interface Seed {
  USERS: User[];
  ORGS: Org[];
  MEMS: Membership[];
  ORGSET: Record<number, OrgSettings>;
  ASM: Record<string, AssignmentMeta>;
  banks: Record<number, Bank>;
  seq: Seq;
}

export const BRAND0: Brand = {
  name: "PROMT",
  tag: "Plan • Run • Optimise Management Tool",
  accent: "#4f46e5",
  nav: "#0e1a3a",
  logo: null,
};

export const asKey = (t: number, u: number) => t + ":" + u;

const ago = (mins: number) => new Date(Date.now() - mins * 60000);

/** Builds a fresh copy of all demo data. `getOrg` tells `User.role` which organization is current. */
export function buildSeed(getOrg: () => number = () => 1): Seed {
  const ME = 2;
  const ORG = 1; // the mock seeds everything while organization 1 is current

  /* ---- users, organizations ---- */
  const ROLE_BY_ORG: Record<number, Record<number, RoleCode>> = {
    1: { 1: "admin", 2: "pm", 3: "member", 4: "member", 5: "member", 6: "viewer" },
    2: { 2: "member", 3: "admin", 4: "pm", 5: "member" },
    3: { 1: "admin", 6: "member", 2: "member" },
  };
  const userRows: [number, string, string, string, string][] = [
    [1, "Anna", "Wiśniewska", "anna.wisniewska@example.com", "+48 600 100 200"],
    [2, "Paweł", "Zieliński", "pm@example.com", "+48 600 100 201"],
    [3, "Karolina", "Lis", "karolina.lis@example.com", "+48 600 100 202"],
    [4, "Michał", "Dąbrowski", "michal.dabrowski@example.com", "+48 600 100 203"],
    [5, "Ewa", "Mazur", "ewa.mazur@example.com", ""],
    [6, "Tomasz", "Kruk", "tomasz.kruk@example.com", "+48 600 100 205"],
  ];
  const USERS: User[] = userRows.map(([id, first, last, email, phone], i) => {
    const roles: Record<number, RoleCode> = {};
    for (const o in ROLE_BY_ORG) if (ROLE_BY_ORG[o][id]) roles[+o] = ROLE_BY_ORG[o][id];
    const u = {
      id,
      first,
      last,
      email,
      phone,
      org: [1, 1, 2, 2, 3, 3][i],
      active: true,
      roles,
    } as User;
    Object.defineProperty(u, "role", {
      get() {
        return this.roles[getOrg()] || "viewer";
      },
      set(v: RoleCode) {
        this.roles[getOrg()] = v;
      },
      enumerable: true,
      configurable: true,
    });
    return u;
  });
  const ORGS: Org[] = [
    { id: 1, name: "Studio Produktowe", active: true },
    { id: 2, name: "Zespół Infrastruktury", active: true },
    { id: 3, name: "Dział Finansów", active: true },
  ];
  const ORGSET: Record<number, OrgSettings> = {
    1: { nip: "5252248481", tz: "Europe/Warsaw", cur: "PLN", prio: ["Najniższy", "Niski", "Średni", "Wysoki", "Krytyczny"] },
    2: { nip: "", tz: "Europe/Warsaw", cur: "PLN", prio: ["Bardzo niski", "Niski", "Normalny", "Pilny", "Blokujący"] },
    3: { nip: "7010001122", tz: "Europe/Warsaw", cur: "PLN", prio: ["Najniższy", "Niski", "Średni", "Wysoki", "Krytyczny"] },
  };

  const seq: Seq = {
    project: 4, funding: 4, user: 6, task: 0, status: 0, group: 0, role: 0, assign: 0,
    milestone: 0, template: 0, pf: 0, expense: 0, time: 0, comment: 0, check: 0,
    attachment: 0, label: 0, notif: 0, audit: 0, org: 3,
  };

  /* ---- projects, fundings ---- */
  const PROJECTS: Project[] = [
    { id: 1, name: "Portal klienta 2.0", description: "Nowy portal dla klientów firmy: panel zamówień, historia płatności, powiadomienia i logowanie SSO. Projekt obejmuje migrację danych z systemu legacy, testy wydajnościowe oraz szkolenie zespołu wsparcia przed wdrożeniem produkcyjnym.", status: "active", start: off(-60), end: off(45), owner: 2, funds: [1, 2], created: -60, updated: -0.1 },
    { id: 2, name: "Migracja infrastruktury do chmury", description: "Przeniesienie usług wewnętrznych do chmury publicznej wraz z automatyzacją wdrożeń.", status: "active", start: off(-30), end: off(90), owner: 3, funds: [4], created: -30, updated: -2 },
    { id: 3, name: "Konferencja PROMT Day", description: "Organizacja jednodniowej konferencji dla użytkowników narzędzia.", status: "planned", start: off(20), end: off(80), owner: 2, funds: [], created: -5, updated: -4 },
    { id: 4, name: "Pilotaż systemu raportowania", description: "Zamknięty pilotaż nowego modułu raportów z trzema zespołami.", status: "closed", start: off(-200), end: off(-20), owner: 2, funds: [3], created: -200, updated: -20 },
  ].map((p) => ({ ...p, hidden: [] as number[] })) as Project[];
  const fundRows: [number, string, string, string, number, FundingType, number, number, number][] = [
    [1, "Grant Innowacje 2026", "Horyzont Cyfrowy", "Narodowe Centrum Badań", 480000, "grant", -90, 240, -90],
    [2, "Sponsoring platformy", "Partnerstwo Technologiczne", "Nordic Cloud Sp. z o.o.", 120000, "sponsorship", -40, 150, -40],
    [3, "Darowizna na szkolenia", "", "Fundacja Rozwoju IT", 25000, "donation", -200, -20, -200],
    [4, "Budżet wewnętrzny Q4", "Plan roczny", "Dział finansów", 60000, "internal", -30, 55, -30],
  ];
  const FEXT: Record<number, { cur: string; agr: string; report: string | null; desc: string }> = {
    1: { cur: "PLN", agr: "NCB/HC/2026/0147", report: off(60), desc: "Prace B+R nad portalem klienta: logowanie SSO, płatności, dostępność." },
    2: { cur: "PLN", agr: "SP/NC/2026/03", report: off(100), desc: "Sponsoring infrastruktury i promocji platformy." },
    3: { cur: "PLN", agr: "DAR/12/2025", report: off(-5), desc: "Szkolenia zespołu wsparcia." },
    4: { cur: "PLN", agr: "", report: null, desc: "" },
  };
  const FUNDINGS: Funding[] = fundRows.map(([id, name, program, funder, amount, type, s, e, created]) => ({
    id, name, program, funder, amount, type, start: off(s), end: off(e), created, ...FEXT[id],
  }));

  /* ---- statuses (4 fixed categories per org + extras) ---- */
  const STATUSES: Status[] = [];
  const mkSt = (org: number, project: number | null, cat: StatusCat, name: string, color: string, pos: number, def = false) => {
    const s: Status = { id: ++seq.status, org, project, cat, name, color, pos, def, active: true };
    STATUSES.push(s);
    return s;
  };
  [1, 2, 3].forEach((o) => {
    mkSt(o, null, "todo", "Do zrobienia", "#64748b", 1, true);
    mkSt(o, null, "in_progress", "W toku", "#f97316", 2);
    mkSt(o, null, "done", "Zrobione", "#22c55e", 5);
    mkSt(o, null, "cancelled", "Anulowane", "#ef4444", 6);
  });
  const stReview = mkSt(1, null, "in_progress", "Do przeglądu", "#8b5cf6", 3);
  const stHold = mkSt(1, null, "todo", "Wstrzymane", "#a16207", 7);
  const stClient = mkSt(1, 1, "in_progress", "Testy u klienta", "#0ea5e9", 4);
  const stOf = (t: Task) => STATUSES.find((s) => s.id === t.sid);
  const stById = (id: number | string) => STATUSES.find((s) => s.id === +id);
  const defSt = () => STATUSES.find((s) => s.def && s.project == null && s.org === ORG);
  const setSid = (t: { sid: number; status: TaskCat }, sid: number) => {
    t.sid = sid;
    const s = STATUSES.find((x) => x.id === t.sid);
    if (s) t.status = CAT_KEY[s.cat];
  };
  const orgSt = (org: number, name: string) =>
    STATUSES.find((s) => s.org === org && s.project == null && s.name === name)!;

  /* ---- tasks ---- */
  type Raw = [string, string, "todo" | "doing" | "done", number, number | null, number | null, number | null, number | null, number[], number];
  const raw: Raw[] = [
    ["Projekt makiet panelu klienta", "Makiety wysokiej wierności dla panelu zamówień.", "done", 2, -50, -35, 1, null, [3], -58],
    ["Konfiguracja pipeline CI/CD", "Build, testy i wdrożenie na staging.", "done", 2, -45, -30, 1, null, [4], -55],
    ["Implementacja logowania SSO", "Integracja z firmowym dostawcą tożsamości.", "doing", 3, -12, 3, 1, 1, [4], -14],
    ["Migracja danych klientów", "Skrypty importu z systemu legacy.", "todo", 3, -3, 6, 1, null, [5], -12],
    ["Testy wydajnościowe API", "Scenariusze obciążeniowe dla kluczowych endpointów.", "todo", 2, 3, 14, 1, null, [4], -10],
    ["Dokumentacja użytkownika", "Instrukcje dla klientów i zespołu wsparcia.", "todo", 1, 5, null, 1, null, [], -9],
    ["Panel powiadomień", "Lista powiadomień i ustawienia kanałów.", "doing", 2, -6, 4, 1, null, [3, 5], -8],
    ["Integracja z systemem płatności", "Obsługa płatności kartą i przelewem.", "doing", 3, -9, -1, 1, 1, [4], -12],
    ["Audyt dostępności (WCAG)", "Przegląd ekranów pod kątem dostępności.", "todo", 2, -2, 3, 1, null, [3], -7],
    ["Widok historii zamówień", "Filtrowanie i eksport do CSV.", "done", 1, -30, -18, 1, null, [3], -40],
    ["Optymalizacja zapytań do bazy", "Indeksy i przebudowa najwolniejszych zapytań.", "done", 2, -28, -15, 1, null, [4], -38],
    ["Szkolenie zespołu wsparcia", "Dwa warsztaty przed startem produkcyjnym.", "todo", 1, 10, 30, 1, null, [], -6],
    ["Poprawki po testach akceptacyjnych", "Lista uwag od pilotażowej grupy klientów.", "todo", 3, -5, -2, 1, null, [5], -6],
    ["Wdrożenie na środowisko staging", "Pełne wdrożenie z danymi testowymi.", "doing", 2, -4, 7, 1, 2, [2, 4], -5],
    ["Przegląd bezpieczeństwa", "Test penetracyjny i przegląd konfiguracji.", "todo", 3, 1, 12, 1, null, [2], -4],
    ["Prototyp wyszukiwarki", "Wyszukiwanie zamówień po numerze i kliencie.", "done", 2, -40, -26, 1, null, [5], -48],
    ["Przygotowanie środowiska testowego", "Dane syntetyczne i izolowana baza.", "done", 2, -38, -27, 1, null, [4], -46],
    ["Inwentaryzacja usług", "Lista usług do przeniesienia wraz z zależnościami.", "done", 2, -28, -20, 2, null, [4], -29],
    ["Plan migracji bazy danych", "Strategia przełączenia bez przestoju.", "doing", 3, -10, 10, 2, 4, [4, 5], -12],
    ["Konfiguracja sieci VPC", "Podsieci, reguły dostępu i routing.", "todo", 2, 2, 20, 2, null, [5], -8],
    ["Raport kosztów chmury", "Miesięczne zestawienie kosztów per usługa.", "todo", 1, -2, 8, 2, 4, [3], -5],
    ["Wybór miejsca konferencji", "Porównanie trzech lokalizacji.", "todo", 3, 20, 35, 3, null, [2], -4],
    ["Zaproszenia dla prelegentów", "Lista 12 osób i szablon zaproszenia.", "todo", 2, 25, 45, 3, null, [], -3],
    ["Raport końcowy pilotażu", "Wnioski i rekomendacje wdrożeniowe.", "done", 2, -60, -25, 4, 3, [2], -62],
    ["Zebranie opinii użytkowników", "Ankieta wśród trzech zespołów pilotażowych.", "done", 1, -90, -50, 4, null, [3], -95],
    ["Rozliczenie 1. transzy grantu", "Zestawienie wydatków i potwierdzenia.", "doing", 3, -5, -1, null, 1, [2], -6],
    ["Sprawozdanie z wydatków", "Sprawozdanie okresowe dla instytucji grantowej.", "todo", 2, 5, 30, null, 1, [], -2],
    ["Faktura dla sponsora", "Wystawienie faktury za pierwszy kwartał.", "todo", 1, -1, 10, null, 2, [2], -3],
    ["Uporządkować archiwum dokumentów", "Wspólny folder bez przypisania do projektu.", "todo", 1, null, null, null, null, [], -1],
  ];
  const TASKS: Task[] = raw.map(([title, desc, status, prio, s, d, project, funding, assg, created]) => {
    const p = ({ 1: 2, 2: 3, 3: 4 } as Record<number, number>)[prio] || 3;
    const t: Task = {
      id: ++seq.task, title, desc, status, sid: 0, prio: p, start: off(s), due: off(d), project, funding, assg, created,
      est: [2, 4, 6, 10, 16][p - 1], author: assg[0] || 2, parent: null, ms: null, group: null, tpl: null, pf: null, mand: false, labels: [],
    };
    setSid(t, orgSt(1, { todo: "Do zrobienia", doing: "W toku", done: "Zrobione" }[status]).id);
    return t;
  });
  const tt = (title: string) => TASKS.find((t) => t.title === title)!;
  setSid(tt("Panel powiadomień"), stReview.id);
  setSid(tt("Wdrożenie na środowisko staging"), stClient.id);
  setSid(tt("Zaproszenia dla prelegentów"), orgSt(1, "Anulowane").id);
  tt("Przegląd bezpieczeństwa").prio = 5;
  tt("Integracja z systemem płatności").prio = 5;
  tt("Dokumentacja użytkownika").prio = 1;
  tt("Uporządkować archiwum dokumentów").est = null;
  PROJECTS[0].hidden = [stHold.id];

  /* ---- memberships ---- */
  const MEMS: Membership[] = [];
  const memRows: [number, number, Membership["status"], string, number | null, number?][] = [
    [1, 1, "active", "Dyrektor operacyjna", -400], [1, 2, "active", "Kierownik projektów", -300],
    [1, 3, "active", "Projektantka UX", -200], [1, 4, "active", "Programista", -180],
    [1, 5, "active", "Programistka", -90], [1, 6, "invited", "Analityk", null, -3],
    [2, 2, "active", "Konsultant", -120], [2, 3, "active", "Kierowniczka zespołu", -250],
    [2, 4, "active", "Inżynier DevOps", -240], [2, 5, "suspended", "Programistka", -60],
    [3, 1, "active", "Dyrektor finansowa", -500], [3, 6, "active", "Księgowy", -100],
    [3, 2, "invited", "Kierownik projektów", null, -1],
  ];
  memRows.forEach(([org, u, status, job, j, inv]) => {
    const usr = USERS.find((x) => x.id === u)!;
    MEMS.push({
      org, user: u, status, job, joined: j == null ? null : off(j),
      invited: off(inv != null ? inv : (j as number) - 2),
      phone: org === 1 ? usr.phone || "" : "",
      email: org === 2 && usr.email ? usr.email.split("@")[0] + "@infra.example.com" : "",
      avatar: "",
    });
  });

  /* ---- groups ---- */
  const GROUPS: Group[] = [];
  const mkG = (org: number, parent: number | null, name: string, desc: string, members: number[]) => {
    const g: Group = { id: ++seq.group, org, parent, name, desc, members, created: off(-100) };
    GROUPS.push(g);
    return g;
  };
  const gP = mkG(1, null, "Zespół produktu", "Wszyscy pracujący nad produktami klienta", [2]);
  const gF = mkG(1, gP.id, "Frontend", "Interfejs i dostępność", [3, 5]);
  const gB = mkG(1, gP.id, "Backend", "API, integracje i bazy danych", [4]);
  mkG(1, null, "Administracja", "Biuro i finanse", [1]);
  const gI = mkG(2, null, "Infrastruktura", "Chmura, sieć i wdrożenia", [2, 3, 4]);
  mkG(2, gI.id, "Dyżur", "Zespół dyżurny", [4]);
  mkG(3, null, "Księgowość", "", [1, 6]);

  /* ---- roles, assignments ---- */
  const ROLES: Role[] = [];
  const allPerms = PERMS.map((p) => p[0]);
  const roleDefs: [RoleCode, string, string[]][] = [
    ["admin", "Administrator organizacji", allPerms],
    ["pm", "Project Manager", allPerms.filter((c) => !["member.manage", "role.manage", "org.settings"].includes(c))],
    ["member", "Członek zespołu", ["project.view", "task.create", "task.edit", "time.log"]],
    ["viewer", "Obserwator", ["project.view"]],
  ];
  [1, 2, 3].forEach((org) => roleDefs.forEach(([code, name, perms]) => ROLES.push({ id: ++seq.role, org, code, name, perms: [...perms] })));
  const rBook: Role = { id: ++seq.role, org: 1, code: null, name: "Księgowość", perms: ["project.view", "funding.manage", "expense.manage"] };
  ROLES.push(rBook);
  const roleBy = (code: RoleCode, org = ORG) => ROLES.find((r) => r.org === org && r.code === code)!;
  const ASSIGN: RoleAssignment[] = [];
  const asg = (org: number, role: number, member: number | null, group: number | null, project: number | null) =>
    ASSIGN.push({ id: ++seq.assign, org, role, member, group, project, created: off(-30) });
  asg(1, roleBy("member", 1).id, null, gP.id, null);
  asg(1, roleBy("pm", 1).id, null, gF.id, 1);
  asg(1, rBook.id, 5, null, null);
  asg(2, roleBy("member", 2).id, null, gI.id, null);

  /* ---- milestones ---- */
  const MILES: Milestone[] = [];
  const mkM = (project: number, name: string, status: Milestone["status"], due: number, pos: number) => {
    const m: Milestone = { id: ++seq.milestone, project, name, status, due: off(due), pos };
    MILES.push(m);
    return m;
  };
  const m1 = mkM(1, "Projekt i prototyp", "done", -25, 1);
  const m2 = mkM(1, "MVP portalu", "active", 10, 2);
  const m3 = mkM(1, "Wdrożenie produkcyjne", "planned", 45, 3);
  const m4 = mkM(2, "Przygotowanie migracji", "active", 12, 1);
  const m5 = mkM(2, "Przełączenie usług", "planned", 60, 2);
  const m6 = mkM(3, "Program konferencji", "planned", 40, 1);
  TASKS.forEach((t) => {
    if (t.project === 1) t.ms = t.status === "done" ? m1.id : t.due && parse(t.due)! > dOff(20) ? m3.id : m2.id;
    if (t.project === 2) t.ms = t.due && parse(t.due)! <= dOff(12) ? m4.id : m5.id;
    if (t.project === 3) t.ms = m6.id;
  });
  tt("Dokumentacja użytkownika").group = gP.id;
  tt("Szkolenie zespołu wsparcia").group = gP.id;
  tt("Audyt dostępności (WCAG)").group = gF.id;
  {
    const v = tt("Konfiguracja sieci VPC");
    v.assg = [];
    v.group = gI.id;
  }
  const addT = (o: Partial<Task> & { title: string; sid: number }) => {
    const t: Task = {
      id: ++seq.task, desc: "", start: null, due: null, project: null, funding: null, assg: [], created: -2, prio: 3, est: 4,
      author: 2, parent: null, ms: null, group: null, tpl: null, pf: null, mand: false, labels: [], status: "todo", ...o,
    };
    setSid(t, o.sid);
    TASKS.push(t);
    return t;
  };
  {
    const sso = tt("Implementacja logowania SSO");
    const s1 = (n: string) => orgSt(1, n).id;
    addT({ title: "Konfiguracja klienta OIDC", project: 1, funding: 1, parent: sso.id, ms: m2.id, sid: s1("Zrobione"), assg: [4], start: off(-12), due: off(-6), author: 4 });
    addT({ title: "Mapowanie ról z dostawcy tożsamości", project: 1, funding: 1, parent: sso.id, ms: m2.id, sid: s1("W toku"), assg: [4], start: off(-5), due: off(2), author: 4 });
    addT({ title: "Testy logowania na staging", project: 1, funding: 1, parent: sso.id, ms: m2.id, sid: s1("Do zrobienia"), group: gB.id, due: off(4), author: 4 });
  }

  /* ---- funding templates, project-funding links, expenses ---- */
  const TEMPL: TaskTemplate[] = [];
  const mkTp = (funding: number, title: string, desc: string, prio: number, est: number, dueDays: number) =>
    TEMPL.push({ id: ++seq.template, funding, title, desc, prio, est, dueDays, status: null });
  mkTp(1, "Raport okresowy dla instytucji", "Sprawozdanie merytoryczne i finansowe za okres.", 4, 16, 90);
  mkTp(1, "Ewidencja czasu pracy zespołu", "Miesięczne karty czasu osób finansowanych z grantu.", 3, 4, 30);
  mkTp(1, "Oznakowanie projektu logo programu", "Logo programu na stronie i w materiałach.", 2, 2, 14);
  mkTp(2, "Raport dla sponsora", "Podsumowanie wykorzystania środków.", 3, 6, 60);
  mkTp(2, "Prezentacja na demo day sponsora", "Krótka prezentacja wyników.", 2, 8, 45);
  mkTp(3, "Rozliczenie darowizny", "Zestawienie wydatków dla fundacji.", 3, 4, 30);
  const PF: ProjectFunding[] = [];
  const mkPF = (project: number, funding: number, a0: number, a1: number, primary: boolean, alloc: number | null, note = "") => {
    const x: ProjectFunding = { id: ++seq.pf, project, funding, a0: off(a0), a1: off(a1), primary, alloc, note, created: off(a0) };
    PF.push(x);
    return x;
  };
  const tasksFromTemplates = (pf: ProjectFunding) => {
    const tps = TEMPL.filter((x) => x.funding === pf.funding);
    const ds = defSt();
    if (tps.some((x) => !x.status) && !ds) throw new Error("organizacja nie ma statusu domyślnego");
    const made: Task[] = tps.map((x) => {
      const st = (x.status && stById(x.status)) || ds!;
      return {
        id: ++seq.task, title: x.title, desc: x.desc, prio: x.prio, est: x.est, start: pf.a0,
        due: pf.a0 && x.dueDays != null ? addDays(pf.a0, x.dueDays) : null, project: pf.project, funding: pf.funding,
        pf: pf.id, tpl: x.id, mand: true, assg: [], created: 0, author: ME, sid: st.id, status: CAT_KEY[st.cat],
        ms: null, group: null, parent: null, labels: [],
      };
    });
    TASKS.push(...made);
    return made;
  };
  {
    const pf1 = mkPF(1, 1, -60, 45, true, 300000, "Etap I wniosku: moduły logowania i płatności.");
    const pf2 = mkPF(1, 2, -40, 45, false, 80000);
    mkPF(2, 4, -30, 55, true, 60000);
    const pf4 = mkPF(4, 3, -200, -20, true, 25000);
    const done = STATUSES.find((s) => s.org === 1 && s.project == null && s.cat === "done")!.id;
    const a = tasksFromTemplates(pf1);
    a[0].assg = [2]; a[0].ms = m3.id;
    setSid(a[1], done); a[1].assg = [3]; a[1].ms = m1.id;
    setSid(a[2], done); a[2].ms = m1.id;
    a.forEach((t) => (t.created = -60));
    const b = tasksFromTemplates(pf2);
    b[0].ms = m3.id; b[1].group = gP.id; b[1].ms = m2.id;
    b.forEach((t) => (t.created = -40));
    tasksFromTemplates(pf4).forEach((t) => { setSid(t, done); t.created = -200; });
    TASKS.forEach((t) => {
      if (t.project != null && t.funding != null && t.pf == null) {
        const x = PF.find((y) => y.project === t.project && y.funding === t.funding);
        if (x) t.pf = x.id;
        else t.funding = null;
      }
    });
  }
  const EXPN: Expense[] = [];
  const mkE = (project: number, pf: number | null, task: number | null, type: string, amount: number, day: number, doc: string, desc: string, by: number, att: string | null) =>
    EXPN.push({ id: ++seq.expense, project, pf, task, type, amount, cur: "PLN", date: off(day), doc, desc, by, att: att ? [{ name: att, size: 184320 }] : [] });
  mkE(1, 1, null, "other", 42000, -30, "LP/03/2026", "Wynagrodzenia zespołu – marzec", 2, "lista_plac_03.pdf");
  mkE(1, 1, tt("Implementacja logowania SSO").id, "external_services", 18500, -12, "FV/2026/114", "Licencje dostawcy SSO", 2, "faktura_114.pdf");
  mkE(1, 2, null, "equipment", 9800, -20, "FV/88/2026", "Serwer testowy", 4, "fv_88.pdf");
  mkE(1, null, null, "travel", 1450, -6, "DEL/04", "Delegacja – warsztaty z klientem", 3, null);
  mkE(2, 3, null, "external_services", 12400, -8, "FV/77/2026", "Usługi chmurowe – luty", 4, "fv_77.pdf");
  mkE(4, 4, null, "courses", 23100, -40, "FV/12/2025", "Materiały szkoleniowe", 2, "fv_12.pdf");

  /* ---- assignments, time, comments, checklists, attachments ---- */
  const ASM: Record<string, AssignmentMeta> = {};
  TASKS.forEach((t) =>
    t.assg.forEach((u) => {
      ASM[asKey(t.id, u)] = {
        by: (PROJECTS.find((p) => p.id === t.project) || { owner: 2 }).owner,
        at: off(t.created),
        start: t.status !== "todo" ? (t.start && parse(t.start)! <= base ? t.start : off(-3)) : null,
        end: t.status === "done" ? (t.due && parse(t.due)! <= base ? t.due : off(-1)) : null,
      };
    }),
  );
  const TIME: TimeEntry[] = [];
  {
    const r = mulberry(7);
    TASKS.forEach((t) => {
      if (t.status === "todo") return;
      t.assg.forEach((u) => {
        for (let d = -20; d <= 0; d++) {
          const w = dOff(d).getDay();
          if (w === 0 || w === 6) continue;
          if (r() < (u === ME ? 0.5 : 0.16))
            TIME.push({ id: ++seq.time, task: t.id, user: u, hours: [1, 1.5, 2, 3, 4][Math.floor(r() * 5)], date: off(d), note: "", created: off(d) });
        }
      });
    });
  }
  const COMS: Comment[] = [];
  const mkC = (task: number | null, author: number, text: string, mins: number, parent: number | null = null, project: number | null = null, att: string | null = null) => {
    const c: Comment = { id: ++seq.comment, task, project, author, text, ts: ago(mins), parent, att: att ? [{ name: att, size: 132000 }] : [] };
    COMS.push(c);
    return c;
  };
  {
    const sso = tt("Implementacja logowania SSO").id;
    const c1 = mkC(sso, 4, "Dostawca tożsamości udostępnił środowisko testowe. Zaczynam od mapowania ról.", 2900);
    mkC(sso, 2, "Świetnie. Pamiętaj o grupach z katalogu – PM-owie mają dostać rolę w projekcie.", 2700, c1.id);
    mkC(tt("Integracja z systemem płatności").id, 4, "Termin minął wczoraj – czekamy na klucze produkcyjne od operatora.", 300);
    const c2 = mkC(tt("Wdrożenie na środowisko staging").id, 2, "Klient testuje od poniedziałku, uwagi zbieram w checkliście „Akceptacja klienta”.", 180);
    mkC(tt("Wdrożenie na środowisko staging").id, 4, "Dane testowe wgram dziś po południu.", 150, c2.id);
    const p1 = mkC(null, 2, "Klient prosi o przesunięcie wdrożenia produkcyjnego o tydzień. Proponuję nowy harmonogram etapu „Wdrożenie produkcyjne”.", 1300, null, 1, "harmonogram_v2.pdf");
    mkC(null, 1, "Zgoda, pod warunkiem że raport okresowy dla instytucji pójdzie w terminie.", 1100, p1.id, 1);
    mkC(null, 3, "Plan przełączenia usług zatwierdzony przez zespół dyżurny.", 900, null, 2);
  }
  const CHECK: ChecklistItem[] = [];
  const mkK = (task: number, list: string, text: string, doneBy: number | null, hAgo: number, assignee: number | null = null) =>
    CHECK.push({ id: ++seq.check, task, list, text, order: CHECK.filter((c) => c.task === task).length + 1, assignee, doneBy: doneBy || null, doneAt: doneBy ? new Date(Date.now() - hAgo * 3600e3) : null });
  {
    const st = tt("Wdrożenie na środowisko staging").id;
    const sso = tt("Implementacja logowania SSO").id;
    mkK(st, "Przed wdrożeniem", "Migracje bazy uruchomione", 4, 30);
    mkK(st, "Przed wdrożeniem", "Zmienne środowiskowe ustawione", 4, 28);
    mkK(st, "Przed wdrożeniem", "Dane testowe załadowane", null, 0, 4);
    mkK(st, "Akceptacja klienta", "Scenariusz logowania", 2, 5);
    mkK(st, "Akceptacja klienta", "Scenariusz płatności", null, 0, 2);
    mkK(st, "Akceptacja klienta", "Raport z testów dla klienta", null, 0, 3);
    mkK(sso, "Kroki", "Rejestracja aplikacji u dostawcy", 4, 200);
    mkK(sso, "Kroki", "Logowanie testowe", 4, 90);
    mkK(sso, "Kroki", "Odświeżanie tokenów i wylogowanie", null, 0);
  }
  const ATT: Attachment[] = [];
  const mkA = (task: number, name: string, size: number, by: number, mins: number) =>
    ATT.push({ id: ++seq.attachment, task, name, size, by, ts: ago(mins) });
  mkA(tt("Wdrożenie na środowisko staging").id, "plan_wdrozenia.pdf", 248000, 2, 600);
  mkA(tt("Implementacja logowania SSO").id, "konfiguracja_idp.png", 91000, 4, 2800);
  const LABELS: Label[] = [];
  {
    const L = (org: number, name: string, color: string) => {
      LABELS.push({ id: ++seq.label, org, name, color });
      return seq.label;
    };
    const fe = L(1, "Frontend", "#0ea5e9"), be = L(1, "Backend", "#8b5cf6"), bug = L(1, "Błąd", "#ef4444"), kl = L(1, "Klient", "#f59e0b");
    const net = L(2, "Sieć", "#14b8a6"), cost = L(2, "Koszty", "#f97316");
    const map: [string, number[]][] = [
      ["Panel powiadomień", [fe]], ["Audyt dostępności (WCAG)", [fe]], ["Implementacja logowania SSO", [be]],
      ["Integracja z systemem płatności", [be, kl]], ["Migracja danych klientów", [be]],
      ["Poprawki po testach akceptacyjnych", [bug, kl]], ["Wdrożenie na środowisko staging", [kl]],
      ["Konfiguracja sieci VPC", [net]], ["Raport kosztów chmury", [cost]], ["Plan migracji bazy danych", [net]],
    ];
    map.forEach(([n, ls]) => { const t = TASKS.find((x) => x.title === n); if (t) t.labels = ls; });
  }

  /* ---- audit log, notifications ---- */
  const AUD: AuditEntry[] = [];
  const seedA = (mins: number, actor: number, action: string, entity: string, target: string, details = "") =>
    AUD.push({ id: ++seq.audit, ts: ago(mins), actor, action, entity, target, details });
  seedA(12, 2, "update", "task", "Wdrożenie na środowisko staging", "Status: Do zrobienia → W trakcie");
  seedA(35, 4, "update", "task", "Integracja z systemem płatności", "Termin przesunięty");
  seedA(70, 1, "update", "user", "karolina.lis@example.com", "Rola: Viewer → Członek zespołu");
  seedA(130, 2, "create", "task", "Przegląd bezpieczeństwa");
  seedA(190, 3, "update", "project", "Portal klienta 2.0", "Opis zmieniony");
  seedA(260, 2, "login", "system", "Logowanie do aplikacji");
  seedA(420, 1, "create", "user", "tomasz.kruk@example.com", "Rola: Viewer");
  seedA(600, 5, "update", "task", "Migracja danych klientów", "Przypisano: Ewa Mazur");
  seedA(1500, 2, "create", "funding", "Sponsoring platformy", "120 000 PLN");
  seedA(1700, 1, "export", "system", "Eksport: Użytkownicy (CSV)", "6 rekordów");
  seedA(2900, 4, "delete", "task", "Zadanie testowe");
  seedA(3100, 2, "update", "funding", "Grant Innowacje 2026", "Kwota zaktualizowana");
  seedA(4400, 1, "import", "system", "Import: Zadania", "12 zaimportowanych, 0 z błędami");
  seedA(5800, 3, "create", "project", "Konferencja PROMT Day");
  seedA(7200, 1, "branding", "branding", "Ustawienia marki", "kolor akcentu");
  seedA(9000, 2, "update", "project", "Pilotaż systemu raportowania", "Status: active → closed");
  seedA(11000, 1, "login", "system", "Logowanie do aplikacji");
  seedA(14000, 4, "create", "task", "Plan migracji bazy danych");
  seedA(20000, 2, "create", "project", "Portal klienta 2.0");
  AUD.forEach((a) => {
    if (a.entity === "task") {
      const t = TASKS.find((x) => x.title === a.target);
      if (t) { a.tid = t.id; a.pid = t.project ?? undefined; }
    } else if (a.entity === "project") {
      const p = PROJECTS.find((x) => x.name === a.target);
      if (p) a.pid = p.id;
    }
    a.org = a.pid === 2 ? 2 : 1;
  });
  const extraA: [number, number, string, string, string, string?][] = [
    [25, 3, "create", "comment", "Implementacja logowania SSO"],
    [60, 2, "create", "funding", "Sponsoring platformy", "Podpięto do projektu „Portal klienta 2.0” · utworzono zadania: 2"],
    [95, 4, "create", "expense", "Licencje dostawcy SSO", "18 500 PLN"],
  ];
  extraA.forEach(([m, actor, action, entity, target, details]) => {
    const t = TASKS.find((x) => x.title === target);
    AUD.push({ id: ++seq.audit, ts: ago(m), actor, action, entity, target, details: details || "", pid: 1, tid: t ? t.id : undefined, org: 1 });
  });
  AUD.sort((a, b) => b.ts.getTime() - a.ts.getTime());
  const NOTIF: Notification[] = [];
  const mkN = (org: number, kind: Notification["kind"], title: string, text: string, tid: number | null, mins: number, read = false) =>
    NOTIF.push({ id: ++seq.notif, org, kind, title, text, tid, ts: ago(mins), read });
  mkN(1, "activity", "Michał Dąbrowski zmienił status", "Wdrożenie na środowisko staging: W toku → Testy u klienta", tt("Wdrożenie na środowisko staging").id, 90);
  mkN(1, "activity", "Ewa Mazur skomentowała zadanie", "Poprawki po testach akceptacyjnych", tt("Poprawki po testach akceptacyjnych").id, 40);
  mkN(1, "activity", "Anna Wiśniewska dodała Cię do grupy", "Zespół produktu – nowe zadania z puli grupy", null, 1500, true);
  mkN(2, "activity", "Karolina Lis przekazała zadanie grupie", "Konfiguracja sieci VPC → pula „Infrastruktura”", tt("Konfiguracja sieci VPC").id, 200);

  /* ---- split into per-organization banks ---- */
  const all: Bank = { PROJECTS, FUNDINGS, TASKS, AUD, STATUSES, ROLES, GROUPS, ASSIGN, MILES, PF, TEMPL, EXPN, TIME, COMS, CHECK, ATT, NOTIF, LABELS };
  const P2 = new Set([2]);
  const F2 = new Set([4]);
  const tOrg: Record<number, number> = {};
  TASKS.forEach((t) => {
    tOrg[t.id] = t.project != null ? (P2.has(t.project) ? 2 : 1) : t.funding != null ? (F2.has(t.funding) ? 2 : 1) : 1;
  });
  TASKS.forEach((t) => {
    if (tOrg[t.id] === 2) {
      const c = stOf(t)!.cat;
      setSid(t, STATUSES.find((s) => s.org === 2 && s.project == null && s.cat === c)!.id);
    }
  });
  const orgOf: { [K in keyof Bank]: (x: Bank[K][number]) => number } = {
    PROJECTS: (p) => (P2.has(p.id) ? 2 : 1),
    FUNDINGS: (f) => (F2.has(f.id) ? 2 : 1),
    TASKS: (t) => tOrg[t.id],
    AUD: (a) => a.org || 1,
    STATUSES: (s) => s.org,
    ROLES: (r) => r.org,
    GROUPS: (g) => g.org,
    ASSIGN: (a) => a.org!,
    MILES: (m) => (P2.has(m.project) ? 2 : 1),
    PF: (x) => (P2.has(x.project) ? 2 : 1),
    TEMPL: (x) => (F2.has(x.funding) ? 2 : 1),
    EXPN: (x) => (P2.has(x.project) ? 2 : 1),
    TIME: (x) => tOrg[x.task],
    COMS: (x) => (x.task != null ? tOrg[x.task] : x.project != null && P2.has(x.project) ? 2 : 1),
    CHECK: (x) => tOrg[x.task],
    ATT: (x) => tOrg[x.task],
    NOTIF: (x) => x.org,
    LABELS: (x) => x.org,
  };
  const banks: Record<number, Bank> = {};
  [1, 2, 3].forEach((o) => {
    const b = {} as Record<string, unknown[]>;
    BANK_KEYS.forEach((k) => {
      b[k] = (all[k] as unknown[]).filter((x) => (orgOf[k] as (x: unknown) => number)(x) === o);
    });
    banks[o] = b as unknown as Bank;
  });

  return { USERS, ORGS, MEMS, ORGSET, ASM, banks, seq };
}
