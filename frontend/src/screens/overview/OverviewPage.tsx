// Port of mock.html vDash().
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { WD, base, dOff, fmt, mulberry } from "@/demo/core";
import { fName, initials, isDueSoon, isOverdue, orgName, pName, user } from "@/demo/helpers";
import { openTask, useDemo } from "@/demo/store";
import { Chip, Due, toast } from "@/demo/ui";

const LV = ["brak aktywności", "niska aktywność", "średnia aktywność", "wysoka aktywność"];
const HD = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];
const AI_FEATURES = [
  "Podsumowanie projektu w 1 klik",
  "Sugestie kolejnych działań (Next best step)",
  "Analiza rytmu pracy i nawyków",
];
const SHORTCUTS = [
  { to: "/projects", letter: "P", title: "Projekty", text: "Przejdź do projektów i utwórz nowy.", pri: true },
  { to: "/tasks", letter: "Z", title: "Zadania", text: "Przejdź do zadań i utwórz nowe.", pri: false },
  { to: "/fundings", letter: "F", title: "Finansowania", text: "Przejdź do finansowań i dodaj nowe.", pri: false },
];

interface Day {
  iso: string;
  wd: string;
  lv: number;
  fut: boolean;
}

/** Four weeks of demo activity (deterministic) and the two insights derived from it. */
function rhythm() {
  const rnd = mulberry(11);
  const start = dOff(-((base.getDay() + 6) % 7) - 21);
  const days: Day[] = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const fut = d > base;
    const w = d.getDay();
    const lv = fut ? 0 : w === 0 ? 0 : w === 6 ? (rnd() > 0.6 ? 1 : 0) : rnd() > 0.72 ? 3 : rnd() > 0.45 ? 2 : 1;
    days.push({ iso: fmt(d), wd: WD[w], lv, fut });
  }
  const past = days.filter((d) => !d.fut);
  const act = past.filter((d) => d.lv > 0).length / Math.max(past.length, 1);
  const reg = act >= 0.75 ? "Regularny rytm" : act >= 0.45 ? "Umiarkowany rytm" : "Nieregularny";
  const bk: Record<string, number[]> = {};
  past.forEach((d) => (bk[d.wd] ??= []).push(d.lv));
  let best = "—";
  let ba = -1;
  Object.entries(bk).forEach(([k, v]) => {
    const a = v.reduce((x, y) => x + y, 0) / v.length;
    if (a > ba) {
      ba = a;
      best = k;
    }
  });
  return { days, reg, best };
}

export default function OverviewPage() {
  const s = useDemo();
  const navigate = useNavigate();
  const { days, reg, best } = useMemo(rhythm, []);
  const me = user(s.ME);
  const h = new Date().getHours();
  const gr = h < 12 ? "Dzień dobry" : h < 18 ? "Cześć" : "Dobry wieczór";
  const p = s.PROJECTS[0];
  const email = me?.email ?? "";

  const mine = s.TASKS.filter((t) => t.assg.includes(s.ME) && t.status !== "done");
  const ovr = mine.filter(isOverdue);
  const soon = mine.filter(isDueSoon);
  const doing = mine.filter((t) => t.status === "doing");
  const urgent = [...mine]
    .sort(
      (a, b) =>
        Number(isOverdue(b)) - Number(isOverdue(a)) || ((a.due || "9999") < (b.due || "9999") ? -1 : 1),
    )
    .slice(0, 4);

  return (
    <div className="mk">
      <header className="dash-hero">
        <div>
          <h1 className="dash-title">
            {gr}, <b>{email}</b>
          </h1>
          <p className="dash-sub">To jest Twoja strona startowa. Wybierz, co chcesz zrobić dalej.</p>
        </div>
        <div className="ucard">
          <span className="av">{me ? initials(me) : "??"}</span>
          <div>
            <b>{email}</b>
            <span className="muted">Organizacja: {orgName(s.orgId)}</span>
          </div>
        </div>
      </header>

      <div className="dash-grid">
        <section className="card wide">
          <div className="dc-h">
            <h2>Na dziś</h2>
            <Chip c="gray">Twoje zadania</Chip>
          </div>
          <div className="today">
            <div className="today-k">
              <div className={"tk2" + (ovr.length ? " bad" : "")}>
                <b>{ovr.length}</b>
                <small>Po terminie</small>
              </div>
              <div className="tk2 warn">
                <b>{soon.length}</b>
                <small>Do 7 dni</small>
              </div>
              <div className="tk2">
                <b>{doing.length}</b>
                <small>W trakcie</small>
              </div>
            </div>
            {urgent.length ? (
              <ul className="today-l">
                {urgent.map((t) => (
                  <li key={t.id}>
                    <button type="button" className="trow" onClick={() => openTask(t.id)}>
                      <span>
                        <b>{t.title}</b>
                        <span className="meta-t">
                          {" · " + (t.project ? pName(t.project) : t.funding ? fName(t.funding) : "Bez projektu")}
                        </span>
                      </span>
                      <span>{t.due ? <Due task={t} /> : <span className="meta-t">Bez terminu</span>}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-s">Brak otwartych zadań. Wszystko zrobione.</div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="dc-h">
            <h2>Ostatnio używany projekt</h2>
            <Chip c="gray">Szybki powrót</Chip>
          </div>
          <div className="lp-top">
            <div>
              <div className="lp-name">{p ? p.name : "Brak projektów"}</div>
              <div className="lp-tag">Nowy portal dla klientów: zamówienia, płatności, powiadomienia.</div>
              <div className="meta">
                <Chip c="green">AKTYWNY</Chip>
                <Chip c="red">WYSOKA AKTYWNOŚĆ</Chip>
                <span className="dots" aria-label="Aktywność: wysoka">
                  <i className="on" />
                  <i className="on" />
                  <i className="on" />
                </span>
                <span className="meta-t">• Ostatnia aktywność: 2 h temu</span>
              </div>
            </div>
            <div className="item-act">
              <Link className="btn" to="/projects" style={{ borderColor: "#e2e8f0" }}>
                Projekty
              </Link>
              <button
                type="button"
                className="btn-indigo"
                disabled={!p}
                onClick={() => p && navigate(`/projects/${p.id}/overview`)}
              >
                Wróć do projektu →
              </button>
            </div>
          </div>
        </section>

        <section className="card ai">
          <div className="dc-h">
            <h2>Asystent AI</h2>
            <Chip c="amber">Wkrótce</Chip>
          </div>
          <p className="muted" style={{ margin: "0 0 6px", color: "#334155", fontSize: "1rem" }}>
            W kolejnych wersjach agent AI pomoże planować, podsumowywać i sugerować kolejne kroki.
          </p>
          {AI_FEATURES.map((f) => (
            <div className="feat" key={f}>
              <i />
              {f}
              <span>
                <Lock size={14} aria-hidden="true" />
              </span>
            </div>
          ))}
          <div className="ai-foot">
            <button type="button" className="ai-try" disabled title="Funkcja w przygotowaniu">
              Wypróbuj AI
            </button>
            <button type="button" className="ai-more" onClick={() => toast("Asystent AI jest w przygotowaniu.")}>
              Co będzie dostępne? →
            </button>
          </div>
        </section>

        <section className="card wide">
          <div className="dc-h">
            <h2>Szybkie skróty</h2>
            <Chip c="sky">Skróty</Chip>
          </div>
          <div className="qas">
            {SHORTCUTS.map((q) => (
              <Link key={q.to} className={"qa" + (q.pri ? " pri" : "")} to={q.to}>
                <span className="qa-i">{q.letter}</span>
                <span>
                  <b>{q.title}</b>
                  <small>{q.text}</small>
                </span>
                <span className="qa-ar">→</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="card wide">
          <div className="dc-h">
            <h2>Twój rytm pracy</h2>
            <Chip c="gray">Ostatnie 4 tygodnie</Chip>
          </div>
          <div className="work">
            <div>
              <div className="muted" style={{ marginBottom: 8 }}>
                Najedź na pole, aby zobaczyć dzień i poziom aktywności.
              </div>
              <div className="heat">
                <div className="heat-g h" aria-hidden="true">
                  {HD.map((x) => (
                    <div key={x}>{x}</div>
                  ))}
                </div>
                <div className="heat-g">
                  {days.map((d) => (
                    <div
                      key={d.iso}
                      className={"hc l" + d.lv + (d.fut ? " fut" : "")}
                      data-tip={d.wd + " • " + d.iso + " • " + (d.fut ? "przyszłość" : LV[d.lv])}
                    />
                  ))}
                </div>
                <div className="heat-l">
                  <span>Niska</span>
                  <i className="hd" />
                  <i className="hd l1" />
                  <i className="hd l2" />
                  <i className="hd l3" />
                  <span>Wysoka</span>
                </div>
              </div>
            </div>
            <div>
              <div className="ins">
                <span className="av" style={{ background: "#eef2f7", color: "#334155" }}>
                  R
                </span>
                <div>
                  <small>Regularność</small>
                  <b>{reg}</b>
                </div>
              </div>
              <div className="ins">
                <span className="av" style={{ background: "#eef2f7", color: "#334155" }}>
                  D
                </span>
                <div>
                  <small>Najmocniejszy dzień</small>
                  <b>{best}</b>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
