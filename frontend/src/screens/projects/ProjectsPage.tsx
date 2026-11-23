// Port of mock.html vProjects().
import { useState } from "react";
import { Link } from "react-router-dom";
import { PS_PL, sortBy, type ProjectStatus } from "@/demo/core";
import type { Project } from "@/demo/data";
import { actorName, projStats } from "@/demo/helpers";
import { logAudit, store, update, useDemo } from "@/demo/store";
import { EmptyState, ProjProgress, closeDialog, openConfirm, openInfo, toast } from "@/demo/ui";
import { FilterBar } from "@/screens/tasks/FilterBar";
import { openProjectForm } from "./projectForm";

interface Filters {
  q: string;
  status: "all" | ProjectStatus;
  mine: boolean;
  sort: string;
}
const DEF: Filters = { q: "", status: "all", mine: false, sort: "-updated_at" };
const SORTS: [string, string][] = [
  ["-updated_at", "Ostatnio zmienione"],
  ["updated_at", "Najdawniej zmienione"],
  ["-created_at", "Najnowsze"],
  ["created_at", "Najstarsze"],
  ["name", "Nazwa A→Z"],
  ["-name", "Nazwa Z→A"],
  ["status", "Status A→Z"],
  ["-status", "Status Z→A"],
  ["start_date", "Start ↑"],
  ["-start_date", "Start ↓"],
  ["end_date", "Koniec ↑"],
  ["-end_date", "Koniec ↓"],
];

function archive(p: Project) {
  update(() => {
    p.status = "archived";
  });
  closeDialog();
  logAudit("archived", "project", p.name, "Status → zarchiwizowany", { pid: p.id });
  toast("Zarchiwizowano projekt");
}

function deleteProject(p: Project) {
  const n = store.TASKS.filter((t) => t.project === p.id).length;
  const f = store.PF.filter((x) => x.project === p.id).length;
  const e = store.EXPN.filter((x) => x.project === p.id).length;
  if (n || f || e) {
    openInfo(
      "Nie można usunąć projektu",
      <>
        <p className="m-p">
          Projekt „{p.name}” ma powiązane dane: zadania ({n}), finansowania ({f}), wydatki ({e}). Baza chroni je przed
          usunięciem.
        </p>
        <p className="m-p">Zamiast usuwać, zarchiwizuj projekt.</p>
        <div className="m-foot">
          <button type="button" className="btn-indigo" onClick={() => archive(p)}>
            Zarchiwizuj projekt
          </button>
        </div>
      </>,
    );
    return;
  }
  openConfirm("Usunąć projekt „" + p.name + "”?", () => {
    update((s) => s.PROJECTS.splice(s.PROJECTS.indexOf(p), 1));
    logAudit("delete", "project", p.name);
    toast("Usunięto projekt");
  });
}

export default function ProjectsPage() {
  useDemo();
  const [F, setF] = useState<Filters>(DEF);
  const set = (patch: Partial<Filters>) => setF((s) => ({ ...s, ...patch }));
  const q = F.q.trim().toLowerCase();
  const items = sortBy(
    store.PROJECTS.filter(
      (p) =>
        (F.status === "all" || p.status === F.status) &&
        (!F.mine || p.owner === store.ME) &&
        (!q || (p.name + " " + p.description).toLowerCase().includes(q)),
    ),
    F.sort,
    {
      updated_at: (p) => p.updated,
      created_at: (p) => p.created,
      name: (p) => p.name.toLowerCase(),
      status: (p) => PS_PL[p.status],
      start_date: (p) => p.start || "",
      end_date: (p) => p.end || "",
    },
  );
  const filtered = !!(q || F.status !== "all" || F.mine);
  const clear = () => set({ q: "", status: "all", mine: false });
  const chips = [
    F.status !== "all" && { label: "Status: " + PS_PL[F.status], onRemove: () => set({ status: "all" }) },
    F.mine && { label: "Tylko moje projekty", onRemove: () => set({ mine: false }) },
    q && { label: "Szukaj: „" + F.q.trim() + "”", onRemove: () => set({ q: "" }) },
  ].filter((c) => !!c);

  return (
    <div className="mk">
      <div className="lp">
        <aside className="lp-side">
          <h2>Filtry</h2>
          <div className="chips">
            {(["all", ...Object.keys(PS_PL)] as Filters["status"][]).map((k) => (
              <button
                key={k}
                type="button"
                className={"chip-btn" + (F.status === k ? " on" : "")}
                onClick={() => set({ status: k })}
              >
                {k === "all" ? "Wszystkie" : PS_PL[k]}
              </button>
            ))}
          </div>
          <label className="switch">
            <input type="checkbox" id="mine" checked={F.mine} onChange={(e) => set({ mine: e.target.checked })} />
            <span>Tylko moje projekty</span>
          </label>
          <div className="sort">
            <label htmlFor="psort">Sortowanie</label>
            <select id="psort" value={F.sort} onChange={(e) => set({ sort: e.target.value })}>
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
            <h1>
              Projekty <span className="cnt">{store.PROJECTS.length}</span>
            </h1>
            <div className="lp-act">
              <input
                className="form-input"
                id="psearch"
                data-search
                title="Skrót: /"
                style={{ width: 220 }}
                placeholder="Szukaj projektu…"
                aria-label="Szukaj projektu"
                value={F.q}
                onChange={(e) => set({ q: e.target.value })}
              />
              <button type="button" className="btn-primary" onClick={() => openProjectForm()}>
                Dodaj projekt
              </button>
            </div>
          </header>
          <FilterBar chips={chips} count={`${items.length} z ${store.PROJECTS.length}`} onClear={clear} />
          {items.length ? (
            <div className="list">
              {items.map((p) => {
                const ms = store.MILES.filter((m) => m.project === p.id);
                const nf = store.PF.filter((x) => x.project === p.id).length;
                return (
                  <div className="item" key={p.id}>
                    <div className="item-top">
                      <div className="grow">
                        <h3>{p.name}</h3>
                        {p.description ? <p className="desc">{p.description}</p> : null}
                        <div className="meta">
                          <span className={"pd-st " + p.status}>{PS_PL[p.status]}</span>
                          {p.start ? <span className="meta-t">• Start: {p.start}</span> : null}
                          {p.end ? <span className="meta-t">• Koniec: {p.end}</span> : null}
                          <span className="meta-t">• Właściciel: {actorName(p.owner)}</span>
                          {nf ? <span className="meta-t">• Finansowania: {nf}</span> : null}
                          {ms.length ? (
                            <span className="meta-t">
                              • Etapy: {ms.filter((m) => m.status === "done").length}/{ms.length}
                            </span>
                          ) : null}
                        </div>
                        <ProjProgress s={projStats(p)} />
                      </div>
                      <div className="item-act">
                        <button type="button" className="btn" onClick={() => openProjectForm(p)}>
                          Edytuj
                        </button>
                        <button type="button" className="btn-danger" onClick={() => deleteProject(p)}>
                          Usuń
                        </button>
                        <Link className="btn" to={`/projects/${p.id}/overview`}>
                          Otwórz projekt
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : filtered ? (
            <EmptyState
              title={q ? `Brak wyników dla „${F.q.trim()}”` : "Brak projektów dla tego filtra"}
              text="Zmień kryteria albo wyczyść filtry."
            >
              <button type="button" className="btn" onClick={clear}>
                Wyczyść filtry
              </button>
            </EmptyState>
          ) : (
            <EmptyState
              title="Nie ma jeszcze projektów"
              text="Utwórz pierwszy projekt, aby planować zadania, finansowania i zespół."
            >
              <button type="button" className="btn-primary" onClick={() => openProjectForm()}>
                Dodaj projekt
              </button>
            </EmptyState>
          )}
        </main>
      </div>
    </div>
  );
}
