// Port of mock.html vTime() and its time-entry form.
import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { WD, base, dOff, fmt, fmtH, off, plural } from "@/demo/core";
import { fName, pName } from "@/demo/helpers";
import { logAudit, nextId, openTask, update, useDemo } from "@/demo/store";
import { Prop, toast } from "@/demo/ui";

const f2 = (h: number) => (h ? String(Math.round(h * 100) / 100).replace(".", ",") : "");
const dl = (d: Date) => d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });

export default function MyTimePage() {
  const s = useDemo();
  const [week, setWeek] = useState(0);
  const [taskId, setTaskId] = useState("");
  const [date, setDate] = useState(fmt(base));
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const today = fmt(base);
  const mon = dOff(-((base.getDay() + 6) % 7) + week * 7);
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
  const iso = days.map(fmt);
  const wk = s.TIME.filter((e) => e.user === s.ME && e.date != null && iso.includes(e.date));
  const ids = [
    ...new Set([
      ...wk.map((e) => e.task),
      ...s.TASKS.filter((t) => t.assg.includes(s.ME) && (t.status === "todo" || t.status === "doing")).map((t) => t.id),
    ]),
  ];
  const rows = ids.map((id) => s.TASKS.find((t) => t.id === id)).filter((t) => !!t);
  const cell = (tid: number, d: string) =>
    wk.filter((e) => e.task === tid && e.date === d).reduce((a, e) => a + e.hours, 0);
  const dayTot = iso.map((d) => wk.filter((e) => e.date === d).reduce((a, e) => a + e.hours, 0));
  const tot = dayTot.reduce((a, b) => a + b, 0);
  const cls = (i: number) => ((i > 4 ? "we" : "") + (iso[i] === today ? " now" : "")).trim();

  const byP: Record<string, number> = {};
  wk.forEach((e) => {
    const t = s.TASKS.find((x) => x.id === e.task);
    const k = t ? (t.project ? pName(t.project) : t.funding ? fName(t.funding) : "Bez projektu") : "—";
    byP[k] = (byP[k] || 0) + e.hours;
  });

  const mine = s.TASKS.filter((t) => t.assg.includes(s.ME) && t.status !== "cancelled");
  const selected = taskId && mine.some((t) => String(t.id) === taskId) ? taskId : mine[0] ? String(mine[0].id) : "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = s.TASKS.find((x) => x.id === +selected);
    const h = parseFloat(hours.replace(",", "."));
    if (!t || !t.assg.includes(s.ME)) return setErr("Czas można zapisać tylko w swoim przypisaniu.");
    if (!(h > 0 && h <= 24)) return setErr("Podaj liczbę godzin od 0,25 do 24.");
    setErr("");
    update((st) => {
      st.TIME.push({ id: nextId("time"), task: t.id, user: st.ME, hours: h, date, note: note.trim(), created: off(0) });
    });
    logAudit("create", "time_entry", t.title, fmtH(h) + " · " + date, { tid: t.id, pid: t.project ?? undefined });
    toast("Zapisano " + fmtH(h) + " · " + t.title);
    setHours("");
    setNote("");
  };

  return (
    <div className="mk">
      <div className="ah">
        <div>
          <h1>Mój czas</h1>
          <p>
            Karta tygodnia z godzinami zarejestrowanymi w Twoich przypisaniach. Wpis czasu zawsze należy do
            przypisania osoby do zadania.
          </p>
        </div>
        <div className="wk">
          <button
            type="button"
            className="btn"
            style={{ borderColor: "#e2e8f0" }}
            aria-label="Poprzedni tydzień"
            onClick={() => setWeek(week - 1)}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <b>
            {dl(days[0])} – {dl(days[6])} {days[6].getFullYear()}
          </b>
          <button
            type="button"
            className="btn"
            style={{ borderColor: "#e2e8f0" }}
            aria-label="Następny tydzień"
            onClick={() => setWeek(week + 1)}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          {week ? (
            <button type="button" className="btn" onClick={() => setWeek(0)}>
              Bieżący tydzień
            </button>
          ) : null}
        </div>
      </div>

      <div className="kt" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
        <div className="kt-i">
          <div className="kt-h">
            <span>Suma tygodnia</span>
            <Clock aria-hidden="true" />
          </div>
          <div className="kt-v">{f2(tot) || 0} h</div>
          <div className="kt-s">
            {wk.length} {plural(wk.length, "wpis", "wpisy", "wpisów")}
          </div>
        </div>
        {Object.entries(byP).map(([k, v]) => (
          <div className="kt-i" key={k}>
            <div className="kt-h">
              <span>{k}</span>
            </div>
            <div className="kt-v">{f2(v)} h</div>
          </div>
        ))}
      </div>

      <div className="tw ts">
        <table>
          <thead>
            <tr>
              <th>Zadanie</th>
              {days.map((d, i) => (
                <th key={i} className={cls(i)}>
                  {WD[d.getDay()]} {d.getDate()}
                </th>
              ))}
              <th>Suma</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((t) => {
                const hs = iso.map((d) => cell(t.id, d));
                return (
                  <tr key={t.id}>
                    <td>
                      <button type="button" className="tlink" onClick={() => openTask(t.id)}>
                        <b>{t.title}</b>
                      </button>
                      <div className="meta-t">
                        {t.project ? pName(t.project) : t.funding ? fName(t.funding) : "Bez projektu"}
                      </div>
                    </td>
                    {hs.map((h, i) => (
                      <td key={i} className={cls(i)}>
                        {f2(h)}
                      </td>
                    ))}
                    <td>
                      <b>{f2(hs.reduce((a, b) => a + b, 0)) || "0"}</b>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9}>
                  <div className="empty-s">Brak przypisanych zadań i wpisów w tym tygodniu.</div>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td>Razem</td>
              {dayTot.map((h, i) => (
                <td key={i} className={cls(i)}>
                  {f2(h)}
                </td>
              ))}
              <td>{f2(tot) || "0"}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <form className="card" style={{ marginTop: 14 }} onSubmit={submit}>
        <h2 className="sh">Dodaj wpis czasu</h2>
        {err ? (
          <p className="m-err" role="alert">
            {err}
          </p>
        ) : null}
        <div className="of t3">
          <div className="fld">
            <label htmlFor="te-t">Zadanie *</label>
            <select id="te-t" value={selected} onChange={(e) => setTaskId(e.target.value)}>
              {mine.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div className="fld">
            <label htmlFor="te-d">
              Dzień pracy *{" "}
              <Prop why="time_entry.work_date – dziś wpis wymaga godziny rozpoczęcia, a dzień liczony ze znacznika czasu zależy od strefy czasowej (A4)." />
            </label>
            <input id="te-d" type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="fld">
            <label htmlFor="te-h">Godziny *</label>
            <input
              id="te-h"
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              required
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
        </div>
        <div className="fld">
          <label htmlFor="te-n">Notatka</label>
          <input id="te-n" type="text" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="m-foot" style={{ marginTop: 4 }}>
          <button className="btn-primary" type="submit" disabled={!mine.length}>
            Zapisz wpis
          </button>
        </div>
      </form>
    </div>
  );
}
