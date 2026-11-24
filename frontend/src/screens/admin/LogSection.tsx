// Port of mock.html aAudit().
import { useState } from "react";
import { AL, EL, ago } from "@/demo/core";
import { actorName, uname } from "@/demo/helpers";
import { useDemo } from "@/demo/store";
import { EmptyState } from "@/demo/ui";
import { audTarget } from "./audit";
import { FilterBar, type FilterChip } from "./FilterBar";

const PAGE = 15;

export default function LogSection() {
  const s = useDemo();
  const [q, setQ] = useState("");
  const [act, setAct] = useState("all");
  const [ent, setEnt] = useState("all");
  const [actor, setActor] = useState("all");
  const [n, setN] = useState(PAGE);
  const ql = q.trim().toLowerCase();
  const rows = s.AUD.filter(
    (a) =>
      (act === "all" || a.action === act) &&
      (ent === "all" || a.entity === ent) &&
      (actor === "all" || a.actor === +actor) &&
      (!ql || (a.target + " " + a.details + " " + actorName(a.actor)).toLowerCase().includes(ql)),
  );
  const chips: FilterChip[] = [];
  if (ql) chips.push({ label: "Szukaj: „" + q.trim() + "”", remove: () => setQ("") });
  if (act !== "all") chips.push({ label: "Akcja: " + (AL[act]?.[1] ?? act), remove: () => setAct("all") });
  if (ent !== "all") chips.push({ label: "Obiekt: " + EL[ent], remove: () => setEnt("all") });
  if (actor !== "all") chips.push({ label: "Użytkownik: " + actorName(+actor), remove: () => setActor("all") });
  const clear = () => {
    setQ("");
    setAct("all");
    setEnt("all");
    setActor("all");
  };
  return (
    <div className="mk">
      <header className="ah">
        <div>
          <h1>
            Dziennik zdarzeń <span className="cnt">{s.AUD.length}</span>
          </h1>
          <p>Kto, co i kiedy zmienił w organizacji. Wpisów nie można edytować ani usuwać. Zdarzenia z tej sesji pojawiają się na górze.</p>
        </div>
      </header>
      <div className="ap-f">
        <input type="text" id="asearch" placeholder="Szukaj w dzienniku…" aria-label="Szukaj w dzienniku" value={q} onChange={(e) => setQ(e.target.value)} />
        <select id="aact" aria-label="Filtr akcji" value={act} onChange={(e) => setAct(e.target.value)}>
          <option value="all">Wszystkie akcje</option>
          {Object.entries(AL).map(([k, v]) => (
            <option key={k} value={k}>
              {v[1]}
            </option>
          ))}
        </select>
        <select id="aent" aria-label="Filtr obiektu" value={ent} onChange={(e) => setEnt(e.target.value)}>
          <option value="all">Wszystkie obiekty</option>
          {Object.entries(EL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select id="aactor" aria-label="Filtr użytkownika" value={actor} onChange={(e) => setActor(e.target.value)}>
          <option value="all">Wszyscy użytkownicy</option>
          {s.USERS.map((u) => (
            <option key={u.id} value={u.id}>
              {uname(u)}
            </option>
          ))}
        </select>
      </div>
      <FilterBar chips={chips} count={`${rows.length} z ${s.AUD.length}`} onClear={clear} />
      <div className="tw audit-t" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>Czas</th>
              <th>Użytkownik</th>
              <th>Akcja</th>
              <th>Obiekt</th>
              <th>Szczegóły</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.slice(0, n).map((a) => {
                const c = AL[a.action] || ["gray", a.action];
                return (
                  <tr key={a.id}>
                    <td title={a.ts.toLocaleString("pl-PL")}>{ago(a.ts)}</td>
                    <td>{actorName(a.actor)}</td>
                    <td>
                      <span className={"chip " + c[0]}>{c[1]}</span>
                    </td>
                    <td>{audTarget(a)}</td>
                    <td>{a.details || "—"}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5}>
                  <EmptyState title="Brak zdarzeń dla tych filtrów" text="Zmień kryteria albo wyczyść filtry.">
                    <button type="button" className="btn" onClick={clear}>
                      Wyczyść filtry
                    </button>
                  </EmptyState>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length > n ? (
        <div className="lp-act" style={{ marginTop: 12, justifyContent: "center" }}>
          <button type="button" className="btn" style={{ borderColor: "#e2e8f0" }} onClick={() => setN(n + PAGE)}>
            Pokaż więcej ({rows.length - n})
          </button>
        </div>
      ) : null}
    </div>
  );
}
