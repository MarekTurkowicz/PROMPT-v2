// "Matryca problemów" and "Profil aspektów" (port of painBlock / aspBars).
import { useNavigate } from "react-router-dom";
import type { Project } from "@/demo/data";
import { base, clamp, parse, projStats, workload } from "@/demo/helpers";
import { store } from "@/demo/store";

export interface OverviewMetrics {
  total: number;
  over: number;
  hOver: number;
  miss: number;
  risk: number;
  delta: number;
  canT: boolean;
  timePct: number;
}

interface Problem {
  label: string;
  imp: number;
  prob: number;
  go: string | null;
  hint: string;
}
interface Axis {
  l: string;
  v: number | null;
  how: string;
}

const IL: Record<number, string> = { 1: "Niski", 2: "Średni", 3: "Wysoki" };
const PL: Record<number, string> = { 1: "Niskie", 2: "Średnie", 3: "Wysokie" };

export function buildPain(p: Project, m: OverviewMetrics) {
  const W = workload(p);
  const hot = W.ppl.filter((x) => x.hot).length;
  const act = W.ppl.filter((x) => !x.inact).length;
  const open = W.ts.length;
  const ms = store.MILES.filter((x) => x.project === p.id);
  const lateMs = ms.filter((x) => x.due && x.status !== "done" && parse(x.due)! < base).length;
  const util = projStats(p).bp;
  const lvl = (sh: number) => (sh >= 0.3 ? 3 : sh >= 0.1 ? 2 : 1);
  const P: Problem[] = [];
  const add = (label: string, n: number, imp: number, prob: number, go: string | null, hint: string) => {
    if (n > 0) P.push({ label, imp, prob, go, hint });
  };
  add("Zadania po terminie", m.over, m.hOver ? 3 : 2, lvl(m.over / Math.max(1, open)), "goto:overdue",
    `${m.over} z ${open} otwartych${m.hOver ? ", w tym " + m.hOver + " o wysokim priorytecie" : ""}`);
  add("Brak dat", m.miss, 1, lvl(m.miss / Math.max(1, m.total)), "goto:nodates", `${m.miss} z ${m.total} zadań bez startu lub terminu`);
  add("Zadania bez osoby", W.unas.length, 2, lvl(W.unas.length / Math.max(1, open)), "tab:team", `${W.unas.length} z ${open} otwartych`);
  add("Przeciążone osoby", hot, 3, lvl(hot / Math.max(1, act)), "tab:team", `${hot} z ${act} osób`);
  add("Etapy po terminie", lateMs, 3, lvl(lateMs / Math.max(1, ms.length)), "tab:milestones", `${lateMs} z ${ms.length} etapów`);
  if (util != null && m.canT && util > m.timePct + 10) {
    add("Wydatki szybsze niż czas", 1, 3, util - m.timePct >= 30 ? 3 : 2, "tab:budget", `wydano ${util}% budżetu przy ${m.timePct}% czasu`);
  }
  if (m.canT && m.delta <= -5) {
    add("Postęp za upływem czasu", 1, 2, -m.delta >= 20 ? 3 : -m.delta >= 10 ? 2 : 1, null, `${-m.delta} pkt proc. za planem`);
  }
  const axes: Axis[] = [
    {
      l: "Harmonogram",
      v: open ? clamp(Math.round(100 - (m.over / open) * 100 - lateMs * 15), 0, 100) : 100,
      how: "Otwarte zadania po terminie i etapy po terminie (−15 za każdy)",
    },
    {
      l: "Budżet",
      v: util == null ? null : m.canT ? clamp(Math.round(100 - Math.max(0, util - m.timePct) * 2), 0, 100) : clamp(100 - util, 0, 100),
      how: "Wydano więcej % budżetu niż upłynęło % czasu = kara",
    },
    {
      l: "Tempo",
      v: m.canT ? clamp(Math.round(75 + m.delta * 1.5), 0, 100) : null,
      how: "Postęp zadań względem upływu czasu; zgodnie z planem = 75",
    },
    {
      l: "Zespół",
      v: act ? clamp(Math.round(100 - (hot / act) * 100 - (W.unas.length / Math.max(1, open)) * 40), 0, 100) : null,
      how: "Kara za przeciążone osoby i zadania bez osoby",
    },
    {
      l: "Kompletność",
      v: m.total ? Math.round(100 - (m.miss / m.total) * 100) : null,
      how: "Odsetek zadań z datą startu i terminem",
    },
    { l: "Ryzyko", v: 100 - m.risk, how: "Odwrotność wskaźnika ryzyka z nagłówka; 100 = brak ryzyka" },
  ];
  return { P, axes };
}

function AspBars({ ax }: { ax: Axis[] }) {
  const rows = ax.slice().sort((a, b) => (a.v ?? 101) - (b.v ?? 101));
  return (
    <>
      <ul className="asp">
        {rows.map((a) => (
          <li className="asp-r" key={a.l}>
            <span>{a.l}</span>
            {a.v == null ? (
              <span className="asp-na">brak danych</span>
            ) : (
              <span className="prog-t" aria-hidden="true">
                <i style={{ width: a.v + "%", background: a.v < 50 ? "#ef4444" : a.v < 75 ? "#f59e0b" : "#6366f1" }} />
              </span>
            )}
            <b className="asp-v">{a.v == null ? "—" : a.v}</b>
          </li>
        ))}
      </ul>
      <details className="dtl">
        <summary>Jak liczymy</summary>
        <ul className="asp-how">
          {ax.map((a) => (
            <li key={a.l}>
              <b>{a.l}:</b> {a.how}
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}

export function PainBlock({ p, m }: { p: Project; m: OverviewMetrics }) {
  const navigate = useNavigate();
  const { P, axes } = buildPain(p, m);
  const go = (target: string) => {
    const [k, v] = target.split(":");
    navigate(k === "goto" ? `/projects/${p.id}/tasks?f=${v}` : `/projects/${p.id}/${v}`);
  };
  const sorted = P.slice().sort((a, b) => b.imp * b.prob - a.imp * a.prob);
  const cell = (i: number, pr: number) => {
    const sc = i * pr;
    const its = P.filter((x) => x.imp === i && x.prob === pr);
    return (
      <div
        key={pr}
        className={"mx-c " + (sc >= 6 ? "hi" : sc >= 3 ? "mid" : "lo")}
        title={`Wpływ: ${IL[i].toLowerCase()} · prawdopodobieństwo: ${PL[pr].toLowerCase()}`}
      >
        {its.map((x) =>
          x.go ? (
            <button key={x.label} type="button" className="mx-i" data-tip={x.label + "|" + x.hint} onClick={() => go(x.go!)}>
              {x.label}
            </button>
          ) : (
            <span key={x.label} className="mx-i" tabIndex={0} data-tip={x.label + "|" + x.hint}>
              {x.label}
            </span>
          ),
        )}
      </div>
    );
  };
  return (
    <div className="pain">
      <div className="card sec">
        <div className="sec-h">
          <h3>Matryca problemów</h3>
          <small>Wykryte problemy: wpływ × prawdopodobieństwo. Kliknij, aby przejść.</small>
        </div>
        <div className="mx">
          {[3, 2, 1].map((i) => (
            <MatrixRow key={i} i={i} cell={cell} />
          ))}
          <div />
          {[1, 2, 3].map((pr) => (
            <div className="mx-x" key={pr}>
              {PL[pr]}
            </div>
          ))}
        </div>
        <div className="mx-ax">
          <span>↑ Wpływ na projekt</span>
          <span>Prawdopodobieństwo (udział zadań lub osób) →</span>
        </div>
        <details className="dtl">
          <summary>Jak liczymy</summary>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            Prawdopodobieństwo rośnie z udziałem zadań, osób lub etapów, których dotyczy problem: poniżej 10% niskie, 10–30% średnie, powyżej 30%
            wysokie. Wpływ zależy od rodzaju problemu (przeciążenie, etapy i wydatki – wysoki; brak dat – niski). Pole czerwone: wpływ ×
            prawdopodobieństwo ≥ 6.
          </p>
        </details>
        {P.length ? (
          <div className="risk-n">
            Najpilniejsze:{" "}
            {sorted.slice(0, 3).map((x, idx) => (
              <span key={x.label}>
                {idx ? " • " : ""}
                <b>{x.label}</b> ({x.hint})
              </span>
            ))}
          </div>
        ) : (
          <div className="risk-n">Nie wykryto problemów.</div>
        )}
      </div>
      <div className="card sec">
        <div className="sec-h">
          <h3>Profil aspektów</h3>
          <small>Od najsłabszego · 0 = źle, 100 = dobrze</small>
        </div>
        <AspBars ax={axes} />
      </div>
    </div>
  );
}

function MatrixRow({ i, cell }: { i: number; cell: (i: number, pr: number) => React.ReactNode }) {
  return (
    <>
      <div className="mx-y">{IL[i]}</div>
      {[1, 2, 3].map((pr) => cell(i, pr))}
    </>
  );
}
