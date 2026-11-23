// Port of mock.html vTasks(), taskCard() and subBlock().
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { sortBy, type TaskCat } from "@/demo/core";
import type { Task } from "@/demo/data";
import { fName, gName, inPool, isOverdue, pName, topLevel } from "@/demo/helpers";
import { store, useDemo } from "@/demo/store";
import { Avatar, Chip, Due, EmptyState, LabelChips, PrioChip, StatusChip, TaskLink } from "@/demo/ui";
import { FilterBar } from "./FilterBar";
import { deleteTask, takeFromPool } from "./taskActions";
import { openTaskForm } from "./taskForm";

type StatusFilter = "all" | TaskCat | "overdue";
type Scope = "all" | "pool" | "unassigned" | "project" | "funding";
interface Filters {
  q: string;
  scope: Scope;
  project: string;
  funding: string;
  status: StatusFilter;
  mine: boolean;
  sort: string;
}
const DEF: Filters = { q: "", scope: "all", project: "", funding: "", status: "all", mine: false, sort: "-created_at" };

const STL: Record<Exclude<StatusFilter, "all">, string> = {
  todo: "Do zrobienia",
  doing: "W toku",
  done: "Zrobione",
  cancelled: "Anulowane",
  overdue: "Po terminie",
};
const STATUS_KEYS: StatusFilter[] = ["all", "todo", "doing", "done", "cancelled", "overdue"];
const SORTS: [string, string][] = [
  ["-created_at", "Najnowsze"],
  ["created_at", "Najstarsze"],
  ["due_date", "Termin ↑"],
  ["-due_date", "Termin ↓"],
  ["priority", "Priorytet ↑"],
  ["-priority", "Priorytet ↓"],
];
const SCOPES: [Scope, string][] = [
  ["all", "Wszystkie"],
  ["pool", ""],
  ["unassigned", "Bez przypisania"],
  ["project", "Według projektu"],
  ["funding", "Według finansowania"],
];

function statusOk(t: Task, k: StatusFilter) {
  return k === "all" || (k === "overdue" ? isOverdue(t) : t.status === k);
}

function SubBlock({ subs }: { subs: Task[] }) {
  const [open, setOpen] = useState(false);
  const d = subs.filter((x) => x.status === "done").length;
  const pc = Math.round((d / subs.length) * 100);
  return (
    <div className="subs-w">
      <button type="button" className="sub-tg" aria-expanded={open} onClick={() => setOpen(!open)}>
        <ChevronRight className="chev" size={14} aria-hidden="true" />
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

function TaskCard({ t }: { t: Task }) {
  const pn = t.project ? pName(t.project) : "";
  const fn = t.funding ? fName(t.funding) : "";
  const subs = store.TASKS.filter((x) => x.parent === t.id);
  const ck = store.CHECK.filter((c) => c.task === t.id);
  const par = t.parent ? store.TASKS.find((x) => x.id === t.parent) : undefined;
  return (
    <div className="item">
      <div className="item-top">
        <div>
          <h3>
            <TaskLink id={t.id}>{t.title}</TaskLink>
          </h3>
          {t.desc ? <p className="desc">{t.desc}</p> : null}
          <div className="meta">
            <StatusChip task={t} up />
            <PrioChip prio={t.prio} />
            {t.mand ? <Chip c="red">Obowiązkowe</Chip> : null}
            <LabelChips task={t} />
            {t.group && !t.assg.length ? <Chip c="sky">Pula: {gName(t.group)}</Chip> : null}
            {pn ? <span className="meta-t">• Projekt: {pn}</span> : null}
            {fn ? <span className="meta-t">• Finansowanie: {fn}</span> : null}
            {par ? <span className="meta-t">• Podzadanie: {par.title}</span> : null}
            {ck.length ? (
              <span className="meta-t">
                • Checklisty: {ck.filter((c) => c.doneBy).length}/{ck.length}
              </span>
            ) : null}
            <Due task={t} />
          </div>
        </div>
        <div className="item-act">
          {inPool(t) ? (
            <button type="button" className="btn-indigo" onClick={() => takeFromPool(t)}>
              Weź zadanie
            </button>
          ) : null}
          <button type="button" className="btn" onClick={() => openTaskForm(t)}>
            Edytuj
          </button>
          <button type="button" className="btn-danger" onClick={() => deleteTask(t)}>
            Usuń
          </button>
        </div>
      </div>
      {subs.length ? <SubBlock subs={subs} /> : null}
    </div>
  );
}

export default function TasksPage() {
  useDemo();
  const [F, setF] = useState<Filters>(DEF);
  const set = (patch: Partial<Filters>) => setF((s) => ({ ...s, ...patch }));
  const q = F.q.trim().toLowerCase();
  const items = sortBy(
    store.TASKS.filter((t) => {
      if (F.scope === "unassigned" && (t.project || t.funding)) return false;
      if (F.scope === "pool" && !inPool(t)) return false;
      if (F.scope === "project" && F.project !== "" && t.project !== +F.project) return false;
      if (F.scope === "funding" && F.funding !== "" && t.funding !== +F.funding) return false;
      if (!statusOk(t, F.status)) return false;
      if (F.mine && !t.assg.includes(store.ME)) return false;
      return !q || [t.title, t.desc, pName(t.project), fName(t.funding)].join(" ").toLowerCase().includes(q);
    }),
    F.sort,
    { created_at: (t) => t.created, due_date: (t) => t.due || "9999", priority: (t) => t.prio },
  );
  const poolN = store.TASKS.filter(inPool).length;
  const filtered = !!(q || F.scope !== "all" || F.status !== "all" || F.mine);
  const clear = () => set({ q: "", scope: "all", project: "", funding: "", status: "all", mine: false });
  const scl: Record<Exclude<Scope, "all">, string> = {
    pool: "Pula moich grup",
    unassigned: "Bez przypisania",
    project: "Według projektu" + (F.project !== "" ? " #" + F.project : ""),
    funding: "Według finansowania" + (F.funding !== "" ? " #" + F.funding : ""),
  };
  const chips = [
    F.status !== "all" && { label: "Status: " + STL[F.status], onRemove: () => set({ status: "all" }) },
    F.mine && { label: "Tylko moje", onRemove: () => set({ mine: false }) },
    F.scope !== "all" && { label: scl[F.scope], onRemove: () => set({ scope: "all" }) },
    q && { label: "Szukaj: „" + F.q.trim() + "”", onRemove: () => set({ q: "" }) },
  ].filter((c) => !!c);

  return (
    <div className="mk">
      <div className="lp">
        <aside className="lp-side">
          <h2>Filtry</h2>
          <div className="grp">
            <div className="lab" id="lst">
              Status
            </div>
            <div className="chips" role="group" aria-labelledby="lst">
              {STATUS_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={"chip-btn" + (F.status === k ? " on" : "")}
                  onClick={() => set({ status: k })}
                >
                  {k === "all" ? "Wszystkie" : STL[k]}
                </button>
              ))}
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" id="tmine" checked={F.mine} onChange={(e) => set({ mine: e.target.checked })} />
            <span>Tylko moje zadania</span>
          </label>
          <div className="lab" style={{ margin: "14px 0 6px" }}>
            Zakres
          </div>
          <div className="filters">
            {SCOPES.map(([k, l]) => (
              <div key={k} style={{ display: "contents" }}>
                <button type="button" className={"btn" + (F.scope === k ? " on" : "")} onClick={() => set({ scope: k })}>
                  {k === "pool" ? `Pula moich grup (${poolN})` : l}
                </button>
                {k === "project" && F.scope === "project" ? (
                  <div className="in-row">
                    <label htmlFor="fp">ID projektu</label>
                    <input
                      id="fp"
                      type="number"
                      min="1"
                      placeholder="np. 1"
                      value={F.project}
                      onChange={(e) => set({ project: e.target.value })}
                    />
                  </div>
                ) : null}
                {k === "funding" && F.scope === "funding" ? (
                  <div className="in-row">
                    <label htmlFor="ff">ID finansowania</label>
                    <input
                      id="ff"
                      type="number"
                      min="1"
                      placeholder="np. 1"
                      value={F.funding}
                      onChange={(e) => set({ funding: e.target.value })}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="sort">
            <label htmlFor="tsort">Sortowanie</label>
            <select id="tsort" value={F.sort} onChange={(e) => set({ sort: e.target.value })}>
              {SORTS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </aside>
        <main className="lp-main">
          <header className="lp-head">
            <h1>Zadania</h1>
            <div className="lp-act">
              <input
                className="form-input"
                id="tsearch"
                data-search
                title="Skrót: /"
                style={{ width: 260 }}
                placeholder="Wyszukaj zadanie…"
                aria-label="Wyszukaj zadanie"
                value={F.q}
                onChange={(e) => set({ q: e.target.value })}
              />
              <button type="button" className="btn-primary" onClick={() => openTaskForm()}>
                Dodaj zadanie
              </button>
              <span className="muted">
                {filtered ? items.length + " / " + store.TASKS.length : store.TASKS.length + " łącznie"}
              </span>
            </div>
          </header>
          <FilterBar chips={chips} onClear={clear} />
          {items.length ? (
            <div className="list">
              {topLevel(items).map((t) => (
                <TaskCard key={t.id} t={t} />
              ))}
            </div>
          ) : filtered ? (
            <EmptyState
              title={q ? `Brak wyników dla „${F.q.trim()}”` : "Brak zadań dla tego filtra"}
              text="Zmień kryteria albo wyczyść filtry."
            >
              <button type="button" className="btn" onClick={clear}>
                Wyczyść filtry
              </button>
            </EmptyState>
          ) : (
            <EmptyState title="Nie ma jeszcze zadań" text="Dodaj pierwsze zadanie, aby zacząć planować pracę.">
              <button type="button" className="btn-primary" onClick={() => openTaskForm()}>
                Dodaj zadanie
              </button>
            </EmptyState>
          )}
        </main>
      </div>
    </div>
  );
}
