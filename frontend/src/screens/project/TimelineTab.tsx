// Port of mock.html vPTimeline(): own HTML timeline (zoom, today line, milestone diamonds), not vis-timeline.
import { useLayoutEffect, useRef, useState } from "react";
import { MSL, PR_PL, ST_PL, base, dBetween, parse, user } from "@/demo/helpers";
import type { Task } from "@/demo/data";
import { store } from "@/demo/store";
import { EmptyState } from "@/demo/ui";
import { useProject } from "./part1/shared";

const ZOOMS: [string, number][] = [
  ["Miesiąc", 8],
  ["Tydzień", 18],
  ["Dzień", 30],
];
const PRIO_COLORS: [string, number][] = [
  ["#94a3b8", 1],
  ["#84cc16", 2],
  ["#3b82f6", 3],
  ["#f97316", 4],
  ["#dc2626", 5],
];
const dd = (d: Date) => String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0");

export default function TimelineTab() {
  const p = useProject();
  const [DW, setDW] = useState(18);
  const [tick, setTick] = useState(0);
  const tl = useRef<HTMLDivElement>(null);
  const todayX = useRef(0);

  useLayoutEffect(() => {
    const el = tl.current;
    if (el) el.scrollLeft = Math.max(0, todayX.current + 170 - el.clientWidth / 2);
  }, [DW, tick, p?.id]);

  if (!p) return <div className="mk"><EmptyState title="Nie znaleziono projektu" text="Wróć do listy projektów." /></div>;
  const ts = store.TASKS.filter((t) => t.project === p.id && (t.start || t.due));
  if (!ts.length) return <div className="mk"><div className="card centered muted">Brak zadań z datami.</div></div>;

  const ids = [...new Set(ts.flatMap((t) => t.assg))].sort((a, b) => a - b);
  const groups: { id: number | "u"; name: string }[] = ids.map((id) => ({ id, name: user(id)?.email ?? "?" }));
  if (ts.some((t) => !t.assg.length)) groups.push({ id: "u", name: "Nieprzypisane" });

  const dates = [...ts.flatMap((t) => [t.start, t.due]), p.start, p.end].filter((x): x is string => !!x).map((x) => parse(x)!);
  const min = new Date(Math.min(...dates.map(Number)));
  const max = new Date(Math.max(...dates.map(Number)));
  min.setDate(min.getDate() - 3);
  max.setDate(max.getDate() + 3);
  const n = dBetween(min, max) + 1;
  const W = n * DW;
  const X = (d: Date) => dBetween(min, d) * DW;
  todayX.current = X(base) + DW / 2;

  const ticks = [];
  for (let i = 0; i < n; i += 7) {
    const d = new Date(min);
    d.setDate(d.getDate() + i);
    ticks.push(
      <div key={i} className="tl-tick" style={{ left: i * DW }}>
        {dd(d)}
      </div>,
    );
  }
  const today = <div className="tl-today" style={{ left: X(base) + DW / 2 }} />;
  const ps = parse(p.start);
  const pe = parse(p.end);
  const miles = store.MILES.filter((m) => m.project === p.id && m.due);

  const rows = groups.map((g) => {
    const its = ts
      .filter((t) => (g.id === "u" ? !t.assg.length : t.assg.includes(g.id)))
      .map((t) => ({ t, s: parse(t.start || t.due)!, e: parse(t.due || t.start)! }))
      .sort((a, b) => a.s.getTime() - b.s.getTime());
    const lanes: Date[] = [];
    const placed = its.map((it) => {
      let l = lanes.findIndex((end) => end < it.s);
      if (l < 0) {
        l = lanes.length;
        lanes.push(it.e);
      } else lanes[l] = it.e;
      return { ...it, l };
    });
    const h = Math.max(1, lanes.length) * 32 + 8;
    return (
      <div className="tl-row" key={g.id}>
        <div className="tl-lab" style={{ height: h }} title={g.name}>
          {g.name}
        </div>
        <div className="tl-trk" style={{ width: W, height: h }}>
          {today}
          {placed.map(({ t, s, e, l }) => (
            <TlBar key={t.id} t={t} left={X(s)} top={4 + l * 32} width={Math.max((dBetween(s, e) + 1) * DW, DW)} />
          ))}
        </div>
      </div>
    );
  });

  const lg = (c: string, l: string) => (
    <span key={l}>
      <i style={{ background: c }} />
      {l}
    </span>
  );

  return (
    <div className="mk">
      <div className="tl-ctl">
        <span className="muted">Skala:</span>
        <div className="seg">
          {ZOOMS.map(([l, v]) => (
            <button key={v} type="button" className={DW === v ? "on" : ""} aria-pressed={DW === v} onClick={() => setDW(v)}>
              {l}
            </button>
          ))}
        </div>
        <button type="button" className="btn" style={{ height: 32, borderColor: "#e2e8f0" }} onClick={() => setTick(tick + 1)}>
          Dziś
        </button>
      </div>
      <div className="tl" ref={tl} tabIndex={0} role="region" aria-label="Oś czasu projektu, przewijana poziomo">
        <div className="tl-in">
          <div className="tl-row tl-ax">
            <div className="tl-lab" style={{ height: 30 }}>
              Osoba
            </div>
            <div className="tl-trk" style={{ width: W, height: 30 }}>
              {ticks}
            </div>
          </div>
          <div className="tl-row">
            <div className="tl-lab" style={{ height: 38 }}>
              Projekt
            </div>
            <div className="tl-trk" style={{ width: W, height: 38 }}>
              {today}
              {ps && pe ? (
                <div className="tl-proj" style={{ left: X(ps), width: (dBetween(ps, pe) + 1) * DW }}>
                  {p.name}
                </div>
              ) : null}
              {miles.map((m) => (
                <div
                  key={m.id}
                  className={"tl-ms" + (m.status === "done" ? " done" : "")}
                  style={{ left: X(parse(m.due)!) + DW / 2 }}
                  tabIndex={0}
                  aria-label={"Etap " + m.name + ", termin " + m.due}
                  data-tip={"Etap: " + m.name + "|Termin: " + m.due + "|" + MSL[m.status][1]}
                />
              ))}
            </div>
          </div>
          {rows}
        </div>
      </div>
      <div className="legend">
        <b>Status:</b>
        {lg("#e5e7eb", "Do zrobienia")}
        {lg("#dbeafe", "W trakcie")}
        {lg("#dcfce7", "Zrobione")}
        <b style={{ marginLeft: 12 }}>Priorytet (lewa krawędź):</b>
        {PRIO_COLORS.map(([c, i]) => lg(c, PR_PL[i]))}
        <span>
          <i style={{ background: "#f59e0b", transform: "rotate(45deg)" }} />
          Etap
        </span>
        <span>
          <i style={{ background: "#ef4444", width: 3, height: 12, borderRadius: 0 }} />
          Dziś
        </span>
      </div>
    </div>
  );
}

function TlBar({ t, left, top, width }: { t: Task; left: number; top: number; width: number }) {
  return (
    <div
      className={`tl-bar ${t.status} p${t.prio}`}
      tabIndex={0}
      aria-label={t.title + ", " + ST_PL[t.status] + ", priorytet " + PR_PL[t.prio]}
      style={{ left, top, width }}
      data-tip={t.title + "|" + ST_PL[t.status] + " • " + PR_PL[t.prio] + "|" + (t.start || "—") + " → " + (t.due || "—")}
    >
      {t.title}
    </div>
  );
}
