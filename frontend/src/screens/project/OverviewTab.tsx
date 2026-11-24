// Port of mock.html vPOverview() (header, pain matrix, work distribution, flow charts, risk radar, activity).
import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Calendar, CheckCircle2, Clock, Info, Puzzle, Repeat, Zap } from "lucide-react";
import {
  PR_PL,
  PS_PL,
  ST_PL,
  WD,
  base,
  clamp,
  dBetween,
  dOff,
  fmt,
  isOverdue,
  parse,
  tasksOf,
} from "@/demo/helpers";
import { EmptyState } from "@/demo/ui";
import { BarChart, DataTable, LineChart, type DailyPoint } from "./part1/charts";
import { PainBlock } from "./part1/pain";
import { useProject } from "./part1/shared";

type Mode = "activity" | "weekly" | "delivery";

const fd = (s: string | null) =>
  s ? parse(s)!.toLocaleDateString("pl-PL", { year: "numeric", month: "short", day: "2-digit" }) : "—";
const MOM = { up: "Momentum rośnie", down: "Momentum spada", stable: "Momentum stabilne", none: "Za mało danych" };

export default function OverviewTab() {
  const p = useProject();
  const [mode, setMode] = useState<Mode>("activity");
  const [descOpen, setDescOpen] = useState(false);
  if (!p) return <div className="mk"><EmptyState title="Nie znaleziono projektu" text="Wróć do listy projektów." /></div>;

  const ts = tasksOf(p.id);
  const total = ts.length;
  const cnt = (s: string) => ts.filter((t) => t.status === s).length;
  const done = cnt("done");
  const doing = cnt("doing");
  const todo = cnt("todo");
  const high = ts.filter((t) => t.prio >= 4).length;
  const over = ts.filter(isOverdue).length;
  const hOver = ts.filter((t) => t.prio >= 4 && isOverdue(t)).length;
  const noS = ts.filter((t) => !t.start).length;
  const noD = ts.filter((t) => !t.due).length;
  const miss = ts.filter((t) => !t.start || !t.due).length;
  const taskPct = Math.round((total ? done / total : 0) * 100);

  const daily: DailyPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = dOff(-i);
    const k = fmt(d);
    daily.push({
      label: String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0"),
      a: ts.filter((t) => t.start === k).length,
      b: ts.filter((t) => t.due === k).length,
    });
  }
  const s7 = daily.slice(-7).reduce((x, y) => x + y.a, 0);
  const p7 = daily.slice(0, 7).reduce((x, y) => x + y.a, 0);
  const trend: keyof typeof MOM =
    s7 === 0 && p7 === 0 ? "none" : p7 === 0 ? "up" : (s7 - p7) / p7 > 0.1 ? "up" : (s7 - p7) / p7 < -0.1 ? "down" : "stable";
  const wd = [0, 0, 0, 0, 0, 0, 0];
  ts.forEach((t) => {
    const d = parse(t.start);
    if (d) wd[d.getDay()]++;
  });
  const wdItems = [1, 2, 3, 4, 5, 6, 0].map((i) => ({ l: WD[i], v: wd[i] }));
  const risk = total
    ? clamp(Math.round((0.5 * (over / total) + 0.3 * (hOver / total) + (0.2 * (noS + noD)) / (total * 2)) * 100), 0, 100)
    : 0;
  const lvl = risk < 35 ? "healthy" : risk < 70 ? "warning" : "critical";
  const ps = parse(p.start);
  const pe = parse(p.end);
  let timePct = 0;
  let delta = 0;
  let canT = false;
  if (ps && pe && pe > ps) {
    canT = true;
    const tot = Math.max(dBetween(ps, pe), 1);
    const cl = base > pe ? pe : base < ps ? ps : base;
    timePct = Math.round((clamp(dBetween(ps, cl), 0, tot) / tot) * 100);
    delta = taskPct - timePct;
  }
  let predDays: number | null = null;
  let predDate: Date | null = null;
  if (done > 0) {
    let fs: Date | null = null;
    ts.filter((t) => t.status === "done").forEach((t) => {
      const d = parse(t.start);
      if (d && (!fs || d < fs)) fs = d;
    });
    if (fs) {
      const vel = done / Math.max(dBetween(fs, base), 1);
      const rem = total - done;
      if (vel > 0 && rem > 0) {
        predDays = Math.round(rem / vel);
        predDate = dOff(predDays);
      }
    }
  }
  const cyc = ts.filter((t) => t.start && t.due).map((t) => dBetween(parse(t.start)!, parse(t.due)!)).filter((x) => x >= 0);
  const sorted = [...cyc].sort((a, b) => a - b);
  const avg = cyc.length ? cyc.reduce((a, b) => a + b, 0) / cyc.length : 0;
  const med = !cyc.length ? 0 : sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  const mx = cyc.length ? sorted[sorted.length - 1] : 0;
  const B: [string, number, number][] = [
    ["0–5 d", 0, 5],
    ["6–10 d", 6, 10],
    ["11–15 d", 11, 15],
    ["16–20 d", 16, 20],
    ["21+ d", 21, 1e9],
  ];
  const buckets = B.map(([l, a, b]) => ({ l, v: cyc.filter((x) => x >= a && x <= b).length }));
  const stT = todo + doing + done;
  const todoP = stT ? Math.round((todo / stT) * 100) : 0;
  const doingP = stT ? Math.round((doing / stT) * 100) : 0;
  const doneP = stT ? Math.max(0, 100 - todoP - doingP) : 0;
  const desc = p.description || "";
  const long = desc.trim().length > 160;
  const note = {
    healthy: "W większości pod kontrolą — obserwuj przeterminowane zadania i brakujące daty.",
    warning: "Są zauważalne problemy — skup się na przeterminowanych i wysokopriorytetowych zadaniach.",
    critical: "Wysokie ryzyko — projekt wymaga uwagi.",
  }[lvl];
  const hint =
    stT === 0
      ? "Brak zadań."
      : doing > todo && doing > done
        ? "Dużo w toku — zwróć uwagę na blokery."
        : todo > doing && todo > done
          ? "Backlog dominuje — rozważ priorytety."
          : done > todo && done > doing
            ? "Duża część gotowa — jesteś blisko końca."
            : "Praca dość równomiernie rozłożona.";
  const recent = [...ts].sort((a, b) => b.created - a.created).slice(0, 4);
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const tasksLink = (f: string) => `/projects/${p.id}/tasks?f=${f}`;
  const rk = (f: string, n: number, icon: React.ReactNode, body: React.ReactNode) => (
    <li>
      {n > 0 ? (
        <Link className="rk" to={tasksLink(f)}>
          {icon} {body}
        </Link>
      ) : (
        <>
          {icon} {body}
        </>
      )}
    </li>
  );
  const tab = (k: Mode, l: string) => (
    <button type="button" className={"tab-s" + (mode === k ? " on" : "")} onClick={() => setMode(k)}>
      {l}
    </button>
  );
  const ic = { size: 14, "aria-hidden": true, style: { verticalAlign: -2 } } as const;

  return (
    <div className="mk">
      <div className="pov">
        <div className="card">
          <div className="pov-hr">
            <div>
              <span className={"pov-pill " + p.status}>{PS_PL[p.status]}</span>
              <h2 className="pov-title">{p.name}</h2>
              {desc ? (
                <>
                  <p className={"pov-desc" + (descOpen ? "" : " col")}>{desc}</p>
                  {long ? (
                    <button type="button" className="lnk" onClick={() => setDescOpen(!descOpen)}>
                      {descOpen ? "Zwiń" : "Pokaż więcej"}
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
            <div className="pov-meta">
              <div className="pov-mi"><small>Start</small><b>{fd(p.start)}</b></div>
              <div className="pov-mi"><small>Koniec</small><b>{fd(p.end)}</b></div>
              <div className="pov-mi"><small>Postęp</small><b>{taskPct}%</b></div>
              <div className="pov-mi"><small>Zadania</small><b>{total}</b></div>
            </div>
            <div className={"mood " + lvl}>
              <span className="dot" style={{ background: lvl === "healthy" ? "#22c55e" : lvl === "warning" ? "#eab308" : "#ef4444" }} />
              <b>{lvl === "healthy" ? "Zdrowo" : lvl === "warning" ? "Uwaga" : "Krytycznie"}</b>
              <span>{risk}/100</span>
            </div>
          </div>
        </div>

        <PainBlock p={p} m={{ total, over, hOver, miss, risk, delta, canT, timePct }} />

        <div className="pov-lay">
          <div className="pov-c pov-main">
            <div className="card sec">
              <div className="sec-h">
                <h3>Rozkład pracy</h3>
                <small>Do zrobienia / w trakcie / zrobione</small>
              </div>
              {stT === 0 ? (
                <div className="empty-s">Brak zadań — dodaj co najmniej jedno.</div>
              ) : (
                <>
                  <div className="dist" role="img" aria-label={`Do zrobienia ${todoP}%, w trakcie ${doingP}%, zrobione ${doneP}%`}>
                    {todoP ? <div className="todo" style={{ width: todoP + "%" }}>Do zrobienia {todoP}%</div> : null}
                    {doingP ? <div className="doing" style={{ width: doingP + "%" }}>W trakcie {doingP}%</div> : null}
                    {doneP ? <div className="done" style={{ width: doneP + "%" }}>Zrobione {doneP}%</div> : null}
                  </div>
                  <div className="health">
                    <div>
                      <div className="prog">
                        <div className="prog-l"><span>Postęp zadań</span><b>{taskPct}%</b></div>
                        <div className="prog-t"><i style={{ width: taskPct + "%", background: "#6366f1" }} /></div>
                      </div>
                      {canT ? (
                        <div className="prog">
                          <div className="prog-l"><span>Upływ czasu</span><b>{timePct}%</b></div>
                          <div className="prog-t"><i style={{ width: timePct + "%", background: "#94a3b8" }} /></div>
                        </div>
                      ) : null}
                    </div>
                    <div>
                      {canT ? (
                        delta >= 5 ? (
                          <div className="hl"><CheckCircle2 {...ic} /> <b>{delta}%</b> do przodu.</div>
                        ) : delta <= -5 ? (
                          <div className="hl"><AlertTriangle {...ic} /> <b>{Math.abs(delta)}%</b> za planem.</div>
                        ) : (
                          <div className="hl"><Info {...ic} /> Mniej więcej zgodnie z planem.</div>
                        )
                      ) : (
                        <div className="hl"><Info {...ic} /> Ustaw start i koniec, aby porównać.</div>
                      )}
                      {predDays != null && predDate ? (
                        <div className="hl">
                          <Calendar {...ic} /> Tempo sugeruje koniec za <b>{predDays} dni</b> ({predDate.toLocaleDateString("pl-PL")}).
                        </div>
                      ) : null}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="card sec">
              <div className="sec-h">
                <h3>Przepływ i wydajność</h3>
                <small>Tempo pracy, rytm tygodnia i szybkość dostarczania</small>
              </div>
              <div className="tabs-s">
                {tab("activity", "Aktywność dzienna")}
                {tab("weekly", "Rytm tygodnia")}
                {tab("delivery", "Skuteczność dostarczania")}
              </div>
              {mode === "activity" ? (
                <>
                  <div className="ch-title">Aktywność dzienna (ostatnie 14 dni)</div>
                  <LineChart
                    pts={daily}
                    s1={{ name: "Rozpoczęte", c: "#4f46e5" }}
                    s2={{ name: "Z terminem", c: "#d97706" }}
                    label="Aktywność dzienna z ostatnich 14 dni"
                  />
                  <div className="ch-foot">{MOM[trend]}</div>
                  <DataTable cap="Aktywność dzienna z ostatnich 14 dni" heads={["Dzień", "Rozpoczęte", "Z terminem"]} rows={daily.map((d) => [d.label, d.a, d.b])} />
                </>
              ) : mode === "weekly" ? (
                <>
                  <div className="ch-title">Rytm tygodnia</div>
                  {wd.every((x) => !x) ? (
                    <div className="empty-s">Brak aktywności.</div>
                  ) : (
                    <BarChart items={wdItems} name="Zadania" label="Liczba zadań według dnia tygodnia" color="#6366f1" />
                  )}
                  <div className="ch-foot">Kiedy zwykle zaczyna się praca.</div>
                  <DataTable cap="Liczba zadań według dnia tygodnia" heads={["Dzień", "Zadania"]} rows={wdItems.map((i) => [i.l, i.v])} />
                </>
              ) : (
                <>
                  <div className="ch-title">Skuteczność dostarczania</div>
                  {!cyc.length ? (
                    <div className="empty-s">Za mało zadań z uzupełnioną datą startu i terminu.</div>
                  ) : (
                    <>
                      <div className="dstats">
                        <div className="dstat"><small>Średnia</small><b>{avg.toFixed(1)} d</b></div>
                        <div className="dstat"><small>Mediana</small><b>{med.toFixed(1)} d</b></div>
                        <div className="dstat"><small>Maks</small><b>{mx.toFixed(1)} d</b></div>
                      </div>
                      <BarChart items={buckets} name="Zadania" label="Rozkład czasu realizacji zadań" color="#6366f1" />
                      <div className="ch-foot">Na podstawie zadań z datą startu i terminem.</div>
                      <DataTable cap="Rozkład czasu realizacji zadań" heads={["Przedział", "Zadania"]} rows={buckets.map((b) => [b.l, b.v])} />
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="pov-c pov-side">
            <div className="card sec">
              <div className="sec-h">
                <h3>Radar ryzyka</h3>
                <small>Najważniejsze czerwone flagi. Kliknij pozycję, aby zobaczyć zadania.</small>
              </div>
              <div className="risk">
                <ul>
                  {rk("overdue", over, <Clock {...ic} />, <><b>{over}</b> zadań przeterminowanych</>)}
                  {rk("highover", hOver, <Zap {...ic} />, <><b>{hOver}</b> przeterminowanych o wysokim priorytecie</>)}
                  {rk("nodates", noS, <Calendar {...ic} />, <><b>{noS}</b> zadań bez daty startu</>)}
                  {rk("nodates", noD, <Calendar {...ic} />, <><b>{noD}</b> zadań bez terminu</>)}
                </ul>
                <ul>
                  {rk("nodates", miss, <Puzzle {...ic} />, <><b>{pct(miss)}%</b> brakujących dat ({miss})</>)}
                  {rk("doing", doing, <Repeat {...ic} />, <><b>{pct(doing)}%</b> w trakcie ({doing})</>)}
                  {rk("high", high, <Zap {...ic} />, <><b>{pct(high)}%</b> wysoki priorytet ({high})</>)}
                </ul>
              </div>
              <div className="risk-n">{note} • {hint}</div>
            </div>
            <div className="card sec">
              <div className="sec-h">
                <h3>Aktywność</h3>
                <small>Ostatnie ruchy w projekcie</small>
              </div>
              {recent.length ? (
                <ul className="feed">
                  {recent.map((t) => (
                    <li key={t.id}>
                      <b>{t.title}</b>
                      <small>
                        Status: {ST_PL[t.status]} • Priorytet: {PR_PL[t.prio]} • Utworzono: {fd(fmt(dOff(t.created)))}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-s">Brak zadań.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
