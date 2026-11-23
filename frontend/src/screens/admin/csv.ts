// CSV parsing, import schemas and export sets for the admin Import / Export screens.
import { CAT_KEY, FT_PL, ROLE_L, ST_PL, off, type RoleCode } from "@/demo/core";
import { orgName, user, visSt } from "@/demo/helpers";
import { store } from "@/demo/store";
import { addUser } from "./members";

export type CsvRow = Record<string, string>;

export function parseCSV(text: string) {
  const t = (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).trim();
  if (!t) return { head: [] as string[], rows: [] as string[][] };
  const first = t.split(/\r?\n/)[0];
  const d = first.split(";").length > first.split(",").length ? ";" : ",";
  const out: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === d) {
      row.push(cur);
      cur = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      row.push(cur);
      cur = "";
      out.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  out.push(row);
  return {
    head: out[0].map((h) => h.trim().toLowerCase()),
    rows: out.slice(1).filter((r) => r.some((c) => c.trim() !== "")),
  };
}

export const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",;\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const dateErr = (v: string) => (v && !/^\d{4}-\d{2}-\d{2}$/.test(v) ? "Data w formacie RRRR-MM-DD" : "");

export type ImportKind = "users" | "projects" | "tasks" | "fundings";
export interface ImportSchema {
  label: string;
  cols: string[];
  req: string[];
  check: (r: CsvRow) => string;
  add: (r: CsvRow) => void;
}

const PROJECT_STATUS = ["new", "planned", "active", "closed", "cancelled", "archived"];

export const IMP: Record<ImportKind, ImportSchema> = {
  users: {
    label: "Użytkownicy",
    cols: ["email", "first_name", "last_name", "role", "phone"],
    req: ["email"],
    check: (r) =>
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)
        ? "Niepoprawny e-mail"
        : store.USERS.some((u) => u.email.toLowerCase() === r.email.toLowerCase())
          ? "E-mail już istnieje"
          : r.role && !(r.role in ROLE_L)
            ? "Nieznana rola"
            : "",
    add: (r) =>
      addUser(
        { email: r.email, first: r.first_name || "", last: r.last_name || "" },
        (r.role as RoleCode) || "member",
        { phone: r.phone || "" },
      ),
  },
  projects: {
    label: "Projekty",
    cols: ["name", "description", "status", "start_date", "end_date"],
    req: ["name"],
    check: (r) =>
      r.status && !PROJECT_STATUS.includes(r.status) ? "Nieznany status" : dateErr(r.start_date) || dateErr(r.end_date),
    add: (r) =>
      store.PROJECTS.unshift({
        id: ++store.seq.project,
        name: r.name,
        description: r.description || "",
        status: !r.status || r.status === "new" ? "planned" : (r.status as "active"),
        start: r.start_date || null,
        end: r.end_date || null,
        owner: store.ME,
        funds: [],
        hidden: [],
        created: 0,
        updated: 0,
      }),
  },
  tasks: {
    label: "Zadania",
    cols: ["title", "description", "status", "priority", "start_date", "due_date", "project_id"],
    req: ["title"],
    check: (r) =>
      r.status && !(r.status in ST_PL)
        ? "Nieznany status"
        : r.priority && ![1, 2, 3, 4, 5].includes(+r.priority)
          ? "Priorytet 1–5"
          : r.project_id && !store.PROJECTS.some((p) => p.id === +r.project_id)
            ? "Nie ma takiego projektu"
            : dateErr(r.start_date) || dateErr(r.due_date),
    add: (r) => {
      const project = r.project_id ? +r.project_id : null;
      const cat = (r.status || "todo") as keyof typeof ST_PL;
      const sts = visSt(project);
      const st = sts.find((s) => CAT_KEY[s.cat] === cat && s.def) ?? sts.find((s) => CAT_KEY[s.cat] === cat) ?? sts[0];
      store.TASKS.unshift({
        id: ++store.seq.task,
        title: r.title,
        desc: r.description || "",
        status: st ? CAT_KEY[st.cat] : cat,
        sid: st?.id ?? 0,
        prio: +r.priority || 3,
        start: r.start_date || null,
        due: r.due_date || null,
        project,
        funding: null,
        assg: [],
        created: 0,
        est: null,
        author: store.ME,
        parent: null,
        ms: null,
        group: null,
        tpl: null,
        pf: null,
        mand: false,
        labels: [],
      });
    },
  },
  fundings: {
    label: "Finansowania",
    cols: ["name", "program", "funder", "amount", "type", "start_date", "end_date"],
    req: ["name"],
    check: (r) =>
      r.amount && isNaN(+r.amount)
        ? "Kwota musi być liczbą"
        : r.type && !(r.type in FT_PL)
          ? "Nieznany typ"
          : dateErr(r.start_date) || dateErr(r.end_date),
    add: (r) =>
      store.FUNDINGS.unshift({
        id: ++store.seq.funding,
        name: r.name,
        program: r.program || "",
        funder: r.funder || "",
        amount: +r.amount || 0,
        type: (r.type || "grant") as keyof typeof FT_PL,
        start: r.start_date || off(0),
        end: r.end_date || null,
        created: 0,
        cur: store.ORGSET[store.orgId]?.cur ?? "PLN",
        agr: "",
        report: null,
        desc: "",
      }),
  },
};

export function importResult(kind: ImportKind, text: string) {
  if (!text.trim()) return null;
  const sch = IMP[kind];
  const { head, rows } = parseCSV(text);
  const missing = sch.req.filter((c) => !head.includes(c));
  const unknown = head.filter((h) => !sch.cols.includes(h));
  const ok: CsvRow[] = [];
  const errs: { line: number; msg: string }[] = [];
  if (!missing.length) {
    rows.forEach((r, i) => {
      const o: CsvRow = {};
      head.forEach((h, j) => {
        o[h] = (r[j] || "").trim();
      });
      const m = sch.req.some((c) => !o[c]) ? "Brak wymaganej wartości" : sch.check(o);
      if (m) errs.push({ line: i + 2, msg: m });
      else ok.push(o);
    });
  }
  return { head, rows, missing, unknown, ok, bad: errs };
}

export type ExportKind = "users" | "projects" | "tasks" | "fundings" | "audit";
interface ExportSet {
  label: string;
  head: string[];
  rows: () => unknown[][];
}
const email = (id: number | null | undefined) => user(id)?.email;
export const EXP: Record<ExportKind, ExportSet> = {
  users: {
    label: "Użytkownicy",
    head: ["id", "email", "first_name", "last_name", "role", "phone", "organization"],
    rows: () => store.USERS.map((u) => [u.id, u.email, u.first, u.last, u.role, u.phone, orgName(u.org)]),
  },
  projects: {
    label: "Projekty",
    head: ["id", "name", "description", "status", "start_date", "end_date", "owner"],
    rows: () => store.PROJECTS.map((p) => [p.id, p.name, p.description, p.status, p.start, p.end, email(p.owner)]),
  },
  tasks: {
    label: "Zadania",
    head: ["id", "title", "description", "status", "priority", "start_date", "due_date", "project_id", "funding_id", "assignees"],
    rows: () =>
      store.TASKS.map((t) => [t.id, t.title, t.desc, t.status, t.prio, t.start, t.due, t.project, t.funding, t.assg.map(email).join(" ")]),
  },
  fundings: {
    label: "Finansowania",
    head: ["id", "name", "program", "funder", "amount_total", "type", "start_date", "end_date"],
    rows: () => store.FUNDINGS.map((f) => [f.id, f.name, f.program, f.funder, f.amount, f.type, f.start, f.end]),
  },
  audit: {
    label: "Dziennik audytu",
    head: ["id", "timestamp", "actor", "action", "entity", "target", "details"],
    rows: () => store.AUD.map((a) => [a.id, a.ts.toISOString(), email(a.actor), a.action, a.entity, a.target, a.details]),
  },
};

export function buildExport(sets: Record<ExportKind, boolean>, format: "csv" | "json") {
  const keys = (Object.keys(EXP) as ExportKind[]).filter((k) => sets[k]);
  let text: string;
  let count = 0;
  if (format === "json") {
    const o: Record<string, unknown[]> = {};
    keys.forEach((k) => {
      const rows = EXP[k].rows();
      count += rows.length;
      o[k] = rows.map((r) => Object.fromEntries(EXP[k].head.map((h, i) => [h, r[i] ?? null])));
    });
    text = JSON.stringify(o, null, 2);
  } else {
    text = keys
      .map((k) => {
        const rows = EXP[k].rows();
        count += rows.length;
        return (keys.length > 1 ? "# " + k + "\n" : "") + [EXP[k].head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
      })
      .join("\n\n");
  }
  return { text, count, keys, bytes: new Blob([text]).size };
}
