// Pure pieces shared by the seed and the helpers: dates, RNG, label tables. No store access here.

export const MS = 864e5;
export const base = new Date();
base.setHours(0, 0, 0, 0);

export const dOff = (n: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
};
export const fmt = (d: Date) =>
  d.getFullYear() +
  "-" +
  String(d.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(d.getDate()).padStart(2, "0");

/** ISO date n days from today; null stays null. */
export function off(n: number): string;
export function off(n: number | null | undefined): string | null;
export function off(n: number | null | undefined): string | null {
  return n == null ? null : fmt(dOff(n));
}
export const parse = (s: string | null | undefined) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const dBetween = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / MS);
export const addDays = (iso: string, n: number) => {
  const d = parse(iso)!;
  return fmt(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
};
export const clamp = (v: number, a: number, b: number) =>
  Math.min(b, Math.max(a, v));
export const cmp = <T>(a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0);
export function sortBy<T>(
  arr: T[],
  key: string,
  get: Record<string, (x: T) => string | number>,
) {
  const desc = key[0] === "-";
  const k = desc ? key.slice(1) : key;
  return [...arr].sort((x, y) => {
    const r = cmp(get[k](x), get[k](y));
    return desc ? -r : r;
  });
}
export const WD = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];

export function mulberry(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const plural = (n: number, a: string, b: string, c: string) =>
  n === 1 ? a : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? b : c;
export const fmtH = (h: number) =>
  String(Math.round(h * 100) / 100).replace(".", ",") + " h";
export const fsize = (b: number) =>
  b >= 1e6
    ? (b / 1e6).toFixed(1).replace(".", ",") + " MB"
    : Math.max(1, Math.round(b / 1024)) + " kB";
export function ago(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "przed chwilą";
  if (m < 60) return m + " min temu";
  const h = Math.floor(m / 60);
  if (h < 24) return h + " h temu";
  const dd = Math.floor(h / 24);
  return dd + (dd === 1 ? " dzień temu" : " dni temu");
}

export type ChipColor = "green" | "amber" | "red" | "sky" | "gray";

/** Task category key (what the mock calls `status`); `sid` is the real, org-defined status. */
export type TaskCat = "todo" | "doing" | "done" | "cancelled";
export type StatusCat = "todo" | "in_progress" | "done" | "cancelled";
export type RoleCode = "admin" | "pm" | "member" | "viewer";
export type ProjectStatus =
  | "planned"
  | "active"
  | "closed"
  | "cancelled"
  | "archived";

export const CAT: Record<StatusCat, string> = {
  todo: "Do zrobienia",
  in_progress: "W toku",
  done: "Zrobione",
  cancelled: "Anulowane",
};
export const CAT_KEY: Record<StatusCat, TaskCat> = {
  todo: "todo",
  in_progress: "doing",
  done: "done",
  cancelled: "cancelled",
};
export const ST_PL: Record<TaskCat, string> = {
  todo: "Do zrobienia",
  doing: "W trakcie",
  done: "Zrobione",
  cancelled: "Anulowane",
};
export const ST_UP: Record<TaskCat, string> = {
  todo: "DO ZROBIENIA",
  doing: "W TOKU",
  done: "ZROBIONE",
  cancelled: "ANULOWANE",
};
/** Priority names 1..5; overwritten with the current organization's names by syncPrio(). */
export const PR_PL: Record<number, string> = {
  1: "Niski",
  2: "Średni",
  3: "Wysoki",
};
export const PS_PL: Record<ProjectStatus, string> = {
  planned: "Planowany",
  active: "Aktywny",
  closed: "Zamknięty",
  cancelled: "Anulowany",
  archived: "Zarchiwizowany",
};
export const FT_PL = {
  grant: "Grant",
  sponsorship: "Sponsoring",
  donation: "Darowizna",
  internal: "Wewnętrzne",
} as const;
export type FundingType = keyof typeof FT_PL;
export const ROLE_L: Record<RoleCode, string> = {
  admin: "Administrator",
  pm: "Project Manager",
  member: "Członek zespołu",
  viewer: "Obserwator",
};
export const MSL: Record<string, [ChipColor, string]> = {
  planned: ["gray", "Planowany"],
  active: ["sky", "W realizacji"],
  done: ["green", "Zakończony"],
};
export const MST: Record<string, [ChipColor, string]> = {
  invited: ["amber", "Zaproszony"],
  active: ["green", "Aktywny"],
  suspended: ["red", "Zawieszony"],
  left: ["gray", "Odszedł"],
};
/** Audit action -> [chip color, label]. */
export const AL: Record<string, [ChipColor, string]> = {
  create: ["green", "Utworzono"],
  update: ["sky", "Zmieniono"],
  delete: ["red", "Usunięto"],
  restore: ["green", "Przywrócono"],
  login: ["gray", "Logowanie"],
  import: ["amber", "Import"],
  export: ["amber", "Eksport"],
  branding: ["sky", "Branding"],
  status_changed: ["sky", "Zmiana statusu"],
  rescheduled: ["sky", "Zmiana terminu"],
  assigned: ["sky", "Przypisano"],
  unassigned: ["gray", "Odpięto"],
  granted: ["green", "Nadano rolę"],
  revoked: ["red", "Odebrano rolę"],
  attached: ["green", "Podpięto finansowanie"],
  detached: ["red", "Odpięto finansowanie"],
  checked: ["green", "Odhaczono punkt"],
  unchecked: ["gray", "Cofnięto odhaczenie"],
  added_to_group: ["green", "Dodano do grupy"],
  removed_from_group: ["gray", "Usunięto z grupy"],
  invited: ["amber", "Zaproszono"],
  reminder_sent: ["amber", "Przypomnienie"],
  moved: ["sky", "Przeniesiono"],
  hidden: ["gray", "Ukryto status"],
  shown: ["sky", "Pokazano status"],
  archived: ["gray", "Zarchiwizowano"],
};
/** Audit entity -> label. */
export const EL: Record<string, string> = {
  user: "Użytkownik",
  project: "Projekt",
  task: "Zadanie",
  funding: "Finansowanie",
  branding: "Branding",
  system: "System",
  expense: "Wydatek",
  comment: "Komentarz",
  attachment: "Załącznik",
  member: "Członek",
  role: "Rola",
  group: "Grupa",
  status: "Status",
  milestone: "Etap",
  org: "Organizacja",
  time_entry: "Wpis czasu",
  checklist_item: "Punkt checklisty",
  task_template: "Szablon zadania",
  label: "Etykieta",
};
/** Expense type labels. */
export const EXT: Record<string, string> = {
  travel: "Podróże",
  courses: "Szkolenia",
  external_services: "Usługi zewnętrzne",
  equipment: "Sprzęt",
  other: "Inne",
};
/** Project tab labels (as in the mock breadcrumbs). */
export const PT_L: Record<string, string> = {
  overview: "Przegląd",
  tasks: "Zadania",
  kanban: "Tablica",
  milestones: "Etapy",
  timeline: "Oś czasu",
  team: "Obciążenie zespołu",
  time: "Czas pracy",
  fundings: "Finansowania",
  budget: "Budżet",
  comments: "Komentarze",
  history: "Historia",
  settings: "Ustawienia",
};
export const PERMS: [string, string][] = [
  ["project.view", "Podgląd projektów"],
  ["project.manage", "Zarządzanie projektami i etapami"],
  ["task.create", "Tworzenie zadań"],
  ["task.edit", "Edycja zadań"],
  ["task.delete", "Usuwanie zadań"],
  ["task.assign", "Przypisywanie osób"],
  ["time.log", "Rejestrowanie czasu"],
  ["funding.manage", "Finansowania i szablony"],
  ["expense.manage", "Wydatki"],
  ["member.manage", "Członkowie i grupy"],
  ["role.manage", "Role i uprawnienia"],
  ["org.settings", "Ustawienia organizacji"],
];
export const ATT_OK = ["pdf", "png", "jpg", "jpeg", "docx", "xlsx", "csv", "txt"];
export const MAX_ATT = 50 * 1024 * 1024;
