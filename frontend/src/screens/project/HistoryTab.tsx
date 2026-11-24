import { useState } from "react";
import { useParams } from "react-router-dom";
import { AL, EL, ago } from "@/demo/core";
import type { AuditEntry } from "@/demo/data";
import { actorName, projectOf } from "@/demo/helpers";
import { useDemo } from "@/demo/store";
import { Chip, Prop } from "@/demo/ui";

const audTarget = (a: AuditEntry) =>
  a.entity === "system" ? a.target : (EL[a.entity] || "") + " „" + a.target + "”";

export default function HistoryTab() {
  const s = useDemo();
  const p = projectOf(useParams().projectId);
  const [F, setF] = useState("all");
  if (!p) return null;
  const all = s.AUD.filter((a) => a.pid === p.id);
  const rows = all.filter((a) => F === "all" || a.entity === F);
  const ents = [...new Set(all.map((a) => a.entity))];

  return (
    <div className="mk">
      <div className="lp-head" style={{ padding: 0 }}>
        <div className="chips">
          {["all", ...ents].map((k) => (
            <button key={k} type="button" className={"chip-btn" + (F === k ? " on" : "")} onClick={() => setF(k)}>
              {k === "all" ? "Wszystko" : EL[k] || k}
            </button>
          ))}
        </div>
      </div>
      <div className="muted">
        Wpisy projektu oraz jego zadań, komentarzy, wydatków i finansowań{" "}
        <Prop why="activity_log.project_id – bez tej kolumny historia projektu wymaga kilku podzapytań po entity_id (A5)." />
      </div>
      <div className="card">
        {rows.length ? (
          <ul className="feed">
            {rows.map((a) => {
              const c = AL[a.action] || ["gray", a.action];
              return (
                <li key={a.id}>
                  <div className="fi">
                    <Chip c={c[0]}>{c[1]}</Chip>
                    <b>{audTarget(a)}</b>
                  </div>
                  <small title={a.ts.toLocaleString("pl-PL")}>
                    {actorName(a.actor)} • {ago(a.ts)}
                    {a.details ? " • " + a.details : ""}
                  </small>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="empty-s">Brak zdarzeń.</div>
        )}
      </div>
    </div>
  );
}
