// Inline SVG charts ported from the mock's lineChart / barChart / dataTable.
import type { ReactNode } from "react";

export interface DailyPoint {
  label: string;
  a: number;
  b: number;
}
interface Series {
  name: string;
  c: string;
}

/** Y axis with at most ~4 steps: step and top value. */
function yScale(mx: number) {
  const step = Math.ceil(Math.max(2, mx) / 4);
  return { step, yMax: step * Math.ceil(Math.max(2, mx) / step) };
}

export function LineChart({ pts, s1, s2, label }: { pts: DailyPoint[]; s1: Series; s2: Series; label: string }) {
  const W = 560;
  const H = 180;
  const pl = 30;
  const pr = 10;
  const pt = 12;
  const pb = 24;
  const { step, yMax } = yScale(Math.max(...pts.map((p) => Math.max(p.a, p.b))));
  const x = (i: number) => pl + (i * (W - pl - pr)) / (pts.length - 1);
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / yMax);
  const grid: ReactNode[] = [];
  for (let v = 0; v <= yMax; v += step) {
    grid.push(
      <g key={v}>
        <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeWidth="1" />
        <text className="ax" x={pl - 6} y={y(v) + 4} textAnchor="end">
          {v}
        </text>
      </g>,
    );
  }
  const path = (k: "a" | "b") => pts.map((p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p[k]).toFixed(1)).join(" ");
  const cw = (W - pl - pr) / (pts.length - 1);
  const last = pts.length - 1;
  return (
    <>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {grid}
        {pts.map((p, i) =>
          i % 2 === 0 || i === last ? (
            <text key={i} className="ax" x={x(i)} y={H - 6} textAnchor="middle">
              {p.label}
            </text>
          ) : null,
        )}
        <path d={path("a")} fill="none" stroke={s1.c} strokeWidth="2" strokeLinejoin="round" />
        <path d={path("b")} fill="none" stroke={s2.c} strokeWidth="2" strokeLinejoin="round" />
        <circle cx={x(last)} cy={y(pts[last].a)} r="4" fill={s1.c} stroke="#fff" strokeWidth="2" />
        <circle cx={x(last)} cy={y(pts[last].b)} r="4" fill={s2.c} stroke="#fff" strokeWidth="2" />
        {pts.map((p, i) => (
          <rect
            key={i}
            x={x(i) - cw / 2}
            y={pt}
            width={cw}
            height={H - pt - pb}
            fill="transparent"
            data-tip={`${p.label}|${s1.name}: ${p.a}|${s2.name}: ${p.b}`}
          />
        ))}
      </svg>
      <div className="legend">
        <span>
          <i style={{ background: s1.c }} />
          {s1.name}
        </span>
        <span>
          <i style={{ background: s2.c }} />
          {s2.name}
        </span>
      </div>
    </>
  );
}

export function BarChart({
  items,
  name,
  label,
  color,
}: {
  items: { l: string; v: number }[];
  name: string;
  label: string;
  color: string;
}) {
  const W = 560;
  const H = 170;
  const pl = 30;
  const pr = 10;
  const pt = 18;
  const pb = 24;
  const { step, yMax } = yScale(Math.max(...items.map((i) => i.v)));
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / yMax);
  const slot = (W - pl - pr) / items.length;
  const bw = Math.min(44, slot * 0.6);
  const grid: ReactNode[] = [];
  for (let v = 0; v <= yMax; v += step) {
    grid.push(
      <g key={v}>
        <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="#e2e8f0" />
        <text className="ax" x={pl - 6} y={y(v) + 4} textAnchor="end">
          {v}
        </text>
      </g>,
    );
  }
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {grid}
      {items.map((it, i) => {
        const cx = pl + slot * i + slot / 2;
        const top = y(it.v);
        return (
          <g key={it.l}>
            <rect x={slot * i + pl} y={pt} width={slot} height={H - pt - pb} fill="transparent" data-tip={`${it.l}|${name}: ${it.v}`} />
            {it.v > 0 ? (
              <>
                <path
                  d={`M${cx - bw / 2} ${H - pb}V${top + 4}a4 4 0 0 1 4-4h${bw - 8}a4 4 0 0 1 4 4V${H - pb}Z`}
                  fill={color}
                  pointerEvents="none"
                />
                <text className="ax" x={cx} y={top - 5} textAnchor="middle" style={{ fill: "#334155" }}>
                  {it.v}
                </text>
              </>
            ) : null}
            <text className="ax" x={cx} y={H - 6} textAnchor="middle">
              {it.l}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function DataTable({ cap, heads, rows }: { cap: string; heads: string[]; rows: (string | number)[][] }) {
  return (
    <details className="dtl">
      <summary>Pokaż dane jako tabelę</summary>
      <div className="tw">
        <table className="dt" aria-label={cap}>
          <thead>
            <tr>
              {heads.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
