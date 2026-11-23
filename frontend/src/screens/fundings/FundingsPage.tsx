// Port of mock.html vFund() and fundExtra().
import { useState } from "react";
import { FT_PL, PR_PL, fmtH, sortBy, type FundingType } from "@/demo/core";
import type { Funding } from "@/demo/data";
import { fundUse, money, pName, spent, stById } from "@/demo/helpers";
import { logAudit, store, update, useDemo } from "@/demo/store";
import { Chip, Due, EmptyState, PrioChip, Prop, StatusChip, openConfirm, toast } from "@/demo/ui";
import { FilterBar } from "@/screens/tasks/FilterBar";
import { openTaskForm } from "@/demo/tasks";
import { openFundingForm, openTemplateForm } from "./fundingForms";
import { openPfForm } from "@/demo/fundingLink";

interface Filters {
  q: string;
  type: "all" | FundingType;
  sort: string;
}
const DEF: Filters = { q: "", type: "all", sort: "-created_at" };
const SORTS: [string, string][] = [
  ["-created_at", "Najnowsze"],
  ["created_at", "Najstarsze"],
  ["name", "Nazwa A→Z"],
  ["-name", "Nazwa Z→A"],
  ["start_date", "Start ↑"],
  ["-start_date", "Start ↓"],
  ["end_date", "Koniec ↑"],
  ["-end_date", "Koniec ↓"],
  ["amount_total", "Kwota ↑"],
  ["-amount_total", "Kwota ↓"],
];
const TYPE_BTNS: [Filters["type"], string][] = [
  ["all", "Wszystkie"],
  ["grant", "Granty"],
  ["sponsorship", "Sponsoring"],
  ["donation", "Darowizny"],
  ["internal", "Wewnętrzne"],
];

function deleteFunding(f: Funding) {
  const n = store.TASKS.filter((t) => t.funding === f.id).length;
  openConfirm(`Usunąć finansowanie „${f.name}”? Powiązane zadania (${n}) zostaną odpięte od finansowania.`, () => {
    update((s) => {
      s.FUNDINGS.splice(s.FUNDINGS.indexOf(f), 1);
      s.TASKS.forEach((t) => {
        if (t.funding === f.id) t.funding = null;
      });
      s.PROJECTS.forEach((p) => {
        p.funds = p.funds.filter((x) => x !== f.id);
      });
    });
    logAudit("delete", "funding", f.name);
    toast("Usunięto finansowanie");
  });
}

function deleteTemplate(id: number) {
  const x = store.TEMPL.find((y) => y.id === id);
  if (!x) return;
  const n = store.TASKS.filter((t) => t.tpl === x.id).length;
  openConfirm(
    `Usunąć szablon „${x.title}”?${n ? " Zadania utworzone z szablonu (" + n + ") zostaną, ale stracą powiązanie z nim." : ""}`,
    () => {
      update((s) => {
        s.TEMPL.splice(s.TEMPL.indexOf(x), 1);
        s.TASKS.forEach((t) => {
          if (t.tpl === x.id) t.tpl = null;
        });
      });
      logAudit("delete", "task_template", x.title, "Finansowanie „" + store.FUNDINGS.find((f) => f.id === x.funding)?.name + "”");
      toast("Usunięto szablon");
    },
  );
}

function FundExtra({ f }: { f: Funding }) {
  const tps = store.TEMPL.filter((x) => x.funding === f.id);
  const links = store.PF.filter((x) => x.funding === f.id);
  const hrs = store.TIME.filter((e) => store.TASKS.find((x) => x.id === e.task)?.funding === f.id).reduce(
    (a, e) => a + e.hours,
    0,
  );
  const lightBtn = { height: 34, borderColor: "#e2e8f0" };
  return (
    <>
      {f.desc ? (
        <p className="desc" style={{ marginTop: 0 }}>
          {f.desc}
        </p>
      ) : null}
      <div className="meta" style={{ marginTop: 0 }}>
        <span className="meta-t">
          Umowa: <b>{f.agr || "—"}</b>
        </span>
        <span className="meta-t">• Waluta: {f.cur}</span>
        <span className="meta-t">• Termin raportu: {f.report || "—"}</span>
        <span className="meta-t">• Zarejestrowany czas: {fmtH(hrs)}</span>
      </div>
      <div className="lp-head" style={{ padding: 0 }}>
        <div>
          <b>Szablony zadań ({tps.length})</b>
          <div className="muted">
            Każde zadanie z szablonu jest obowiązkowe.{" "}
            <Prop why="task_template.mandatory do usunięcia – zadania z szablonu finansowania są zawsze obowiązkowe, zadań opcjonalnych nie przewidujemy (uwaga z przeglądu makiety)." />
          </div>
        </div>
        <button type="button" className="btn" style={lightBtn} onClick={() => openTemplateForm(null, f.id)}>
          Dodaj szablon
        </button>
      </div>
      {tps.length ? (
        tps.map((x) => (
          <div className="sub-item" key={x.id}>
            <div>
              <b>{x.title}</b>
              <div className="meta">
                <span className="meta-t">Priorytet: {PR_PL[x.prio]}</span>
                <span className="meta-t">• Szacunek: {x.est ? fmtH(x.est) : "—"}</span>
                <span className="meta-t">• Termin: początek alokacji + {x.dueDays ?? "—"} dni</span>
                <span className="meta-t">
                  • Status: {x.status && stById(x.status) ? stById(x.status)!.name : "domyślny organizacji"}
                </span>
              </div>
            </div>
            <div className="row2">
              <button type="button" className="mini" onClick={() => openTemplateForm(x, x.funding)}>
                Edytuj
              </button>
              <button type="button" className="mini dang" onClick={() => deleteTemplate(x.id)}>
                Usuń
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="empty-s">Brak szablonów – podpięcie nie utworzy zadań.</div>
      )}
      <div className="lp-head" style={{ padding: 0 }}>
        <b>Projekty ({links.length})</b>
        <button type="button" className="btn" style={lightBtn} onClick={() => openPfForm(null, f.id)}>
          Podepnij do projektu
        </button>
      </div>
      {links.length ? (
        links.map((x) => (
          <div className="sub-item" key={x.id}>
            <div>
              <b>{pName(x.project)}</b> {x.primary ? <Chip c="green">Główne</Chip> : null}
              <div className="meta">
                <span className="meta-t">
                  Alokacja {x.a0 || "—"} → {x.a1 || "—"}
                </span>
                <span className="meta-t">• Kwota: {x.alloc != null ? money(x.alloc, f.cur) : "—"}</span>
                <span className="meta-t">• Wydatki: {money(spent(x), f.cur)}</span>
              </div>
              {x.note ? <div className="muted">{x.note}</div> : null}
            </div>
          </div>
        ))
      ) : (
        <div className="empty-s">Nie podpięto do żadnego projektu.</div>
      )}
    </>
  );
}

export default function FundingsPage() {
  useDemo();
  const [F, setF] = useState<Filters>(DEF);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const set = (patch: Partial<Filters>) => setF((s) => ({ ...s, ...patch }));
  const toggle = (id: number) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const q = F.q.trim().toLowerCase();
  const items = sortBy(
    store.FUNDINGS.filter(
      (f) =>
        (F.type === "all" || f.type === F.type) && (!q || [f.name, f.program, f.funder].join(" ").toLowerCase().includes(q)),
    ),
    F.sort,
    {
      created_at: (f) => f.created,
      name: (f) => f.name.toLowerCase(),
      start_date: (f) => f.start || "",
      end_date: (f) => f.end || "",
      amount_total: (f) => f.amount,
    },
  );
  const filtered = !!(q || F.type !== "all");
  const clear = () => set({ q: "", type: "all" });
  const chips = [
    F.type !== "all" && { label: "Typ: " + FT_PL[F.type], onRemove: () => set({ type: "all" }) },
    q && { label: "Szukaj: „" + F.q.trim() + "”", onRemove: () => set({ q: "" }) },
  ].filter((c) => !!c);

  return (
    <div className="mk">
      <div className="lp">
        <aside className="lp-side">
          <h2>Filtry</h2>
          <div className="filters">
            {TYPE_BTNS.map(([k, l]) => (
              <button key={k} type="button" className={"btn" + (F.type === k ? " on" : "")} onClick={() => set({ type: k })}>
                {l}
              </button>
            ))}
          </div>
          <div className="sort">
            <label htmlFor="fsort">Sortowanie</label>
            <select id="fsort" value={F.sort} onChange={(e) => set({ sort: e.target.value })}>
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
              Finansowania <span className="cnt">{store.FUNDINGS.length}</span>
            </h1>
            <div className="lp-act">
              <input
                className="form-input"
                id="fsearch"
                data-search
                title="Skrót: /"
                style={{ width: 260 }}
                placeholder="Wyszukaj finansowanie…"
                aria-label="Wyszukaj finansowanie"
                value={F.q}
                onChange={(e) => set({ q: e.target.value })}
              />
              <button type="button" className="btn-primary" onClick={() => openFundingForm()}>
                Dodaj finansowanie
              </button>
            </div>
          </header>
          <FilterBar chips={chips} count={`${items.length} z ${store.FUNDINGS.length}`} onClear={clear} />
          {items.length ? (
            <div className="list">
              {items.map((f) => {
                const isOpen = !!open[f.id];
                const ts = store.TASKS.filter((t) => t.funding === f.id);
                const u = fundUse(f);
                return (
                  <div className="item" key={f.id}>
                    <div
                      className="item-top acc"
                      role="button"
                      tabIndex={0}
                      aria-expanded={isOpen}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest(".item-act")) return;
                        toggle(f.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          toggle(f.id);
                        }
                      }}
                    >
                      <div className="grow">
                        <h3>{f.name}</h3>
                        <p className="desc">{(f.program || "—") + " • " + (f.funder || "—")}</p>
                        <div className="meta">
                          <Chip c="sky">{money(f.amount, f.cur)}</Chip>
                          {f.start ? (
                            <span className="meta-t">
                              • {f.start} → {f.end || "—"}
                            </span>
                          ) : null}
                          <span className="meta-t">• Typ finansowania: {FT_PL[f.type]}</span>
                        </div>
                        <div className="pbar">
                          <div className="prog-l">
                            <span>
                              Wydano {money(u.sp, f.cur)} z {money(f.amount, f.cur)}
                            </span>
                            <b>{u.pc}%</b>
                          </div>
                          <div className="prog-t" role="img" aria-label={`Wykorzystanie ${u.pc}%`}>
                            <i
                              style={{
                                width: u.pc + "%",
                                background: u.pc > 90 ? "#ef4444" : u.pc > 70 ? "#f59e0b" : "#6366f1",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="item-act">
                        <button type="button" className="btn" onClick={() => openFundingForm(f)}>
                          Edytuj
                        </button>
                        <button type="button" className="btn-danger" onClick={() => deleteFunding(f)}>
                          Usuń
                        </button>
                      </div>
                    </div>
                    {isOpen ? (
                      <div className="acc-body">
                        <FundExtra f={f} />
                        <div className="lp-head" style={{ padding: 0 }}>
                          <b>Zadania finansowania ({ts.length})</b>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ height: 34, minWidth: 0, padding: "0 14px" }}
                            onClick={() => openTaskForm(null, { funding: f.id })}
                          >
                            Dodaj zadanie
                          </button>
                        </div>
                        {ts.length ? (
                          ts.map((t) => (
                            <div className="sub-item" key={t.id}>
                              <div>
                                <b>{t.title}</b>
                                <div className="meta">
                                  <StatusChip cat={t.status} up />
                                  <PrioChip prio={t.prio} />
                                  <Due task={t} />
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="empty-s">Brak zadań dla tego finansowania.</div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : filtered ? (
            <EmptyState
              title={q ? `Brak wyników dla „${F.q.trim()}”` : "Brak finansowań tego typu"}
              text="Zmień kryteria albo wyczyść filtry."
            >
              <button type="button" className="btn" onClick={clear}>
                Wyczyść filtry
              </button>
            </EmptyState>
          ) : (
            <EmptyState
              title="Nie ma jeszcze finansowań"
              text="Dodaj grant, sponsoring lub budżet wewnętrzny, aby przypisać do niego zadania."
            >
              <button type="button" className="btn-primary" onClick={() => openFundingForm()}>
                Dodaj finansowanie
              </button>
            </EmptyState>
          )}
        </main>
      </div>
    </div>
  );
}
