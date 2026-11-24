import { Clock } from "lucide-react";
import { useParams } from "react-router-dom";
import { actorName, fName, fmtH, plural, projectOf } from "@/demo/helpers";
import { useDemo } from "@/demo/store";
import { EmptyState, TaskLink } from "@/demo/ui";

function Bar({ label, h, tot }: { label: React.ReactNode; h: number; tot: number }) {
  return (
    <div className="prog">
      <div className="prog-l">
        <span>{label}</span>
        <b>{fmtH(h)}</b>
      </div>
      <div className="prog-t">
        <i style={{ width: (tot ? Math.round((h / tot) * 100) : 0) + "%", background: "#6366f1" }} />
      </div>
    </div>
  );
}

function Tile({ h, v, s }: { h: string; v: React.ReactNode; s: string }) {
  return (
    <div className="kt-i">
      <div className="kt-h">
        <span>{h}</span>
        <Clock size={16} aria-hidden="true" />
      </div>
      <div className="kt-v">{v}</div>
      <div className="kt-s">{s}</div>
    </div>
  );
}

export default function TimeTab() {
  const s = useDemo();
  const p = projectOf(useParams().projectId);
  if (!p) return null;
  const ts = s.TASKS.filter((t) => t.project === p.id);
  const ids = new Set(ts.map((t) => t.id));
  const es = s.TIME.filter((e) => ids.has(e.task));
  const tot = es.reduce((a, e) => a + e.hours, 0);
  const est = ts.reduce((a, t) => a + (t.est || 0), 0);
  const grp = <K,>(key: (e: (typeof es)[number]) => K) => {
    const m = new Map<K, number>();
    es.forEach((e) => m.set(key(e), (m.get(key(e)) || 0) + e.hours));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const byU = grp((e) => e.user);
  const byT = grp((e) => e.task);
  const byF = grp((e) => {
    const t = s.TASKS.find((x) => x.id === e.task);
    return t && t.funding ? fName(t.funding) : "Bez finansowania";
  });

  return (
    <div className="mk">
      <div className="muted">Raport czasu: suma wpisów z przypisań osób do zadań projektu.</div>
      <div className="kt" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", marginTop: 10 }}>
        <Tile h="Zarejestrowano" v={fmtH(tot)} s={es.length + " " + plural(es.length, "wpis", "wpisy", "wpisów")} />
        <Tile h="Szacunek zadań" v={fmtH(est)} s={est ? Math.round((tot / est) * 100) + "% szacunku" : "brak szacunków"} />
        <Tile h="Osoby" v={byU.length} s="z wpisami czasu" />
      </div>
      {es.length ? (
        <div className="cards3">
          <div className="card">
            <h2 className="sh">Według osób</h2>
            {byU.map(([u, h]) => (
              <Bar key={u} label={actorName(u)} h={h} tot={tot} />
            ))}
          </div>
          <div className="card">
            <h2 className="sh">Według finansowania</h2>
            {byF.map(([f, h]) => (
              <Bar key={f} label={f} h={h} tot={tot} />
            ))}
          </div>
          <div className="card">
            <h2 className="sh">Według zadań</h2>
            {byT.slice(0, 8).map(([tid, h]) => {
              const t = s.TASKS.find((x) => x.id === tid);
              return <Bar key={tid} label={t ? <TaskLink id={t.id}>{t.title}</TaskLink> : "—"} h={h} tot={tot} />;
            })}
          </div>
        </div>
      ) : (
        <EmptyState title="Brak wpisów czasu" text="Czas rejestrują osoby przypisane do zadań projektu." />
      )}
    </div>
  );
}
