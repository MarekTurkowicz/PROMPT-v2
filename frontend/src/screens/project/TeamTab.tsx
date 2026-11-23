import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { off } from "@/demo/core";
import { asKey, type Task } from "@/demo/data";
import {
  actorName,
  activeMem,
  estH,
  fmtH,
  gName,
  initials,
  plural,
  projectOf,
  uname,
  workload,
  wlRecs,
  type Workload,
} from "@/demo/helpers";
import { logAudit, store, update, useDemo } from "@/demo/store";
import { Chip, Due, EmptyState, PrioChip, StatusChip, TaskLink, toast } from "@/demo/ui";

function reassign(t: Task, from: number | null, to: number | null) {
  if (from === to) return false;
  if (to != null && !activeMem(to)) {
    toast("Zadanie można przekazać tylko aktywnemu członkowi organizacji.");
    return false;
  }
  if (to != null && t.assg.includes(to)) {
    toast(actorName(to) + " ma już to zadanie.");
    return false;
  }
  const prev = [...t.assg];
  const snap: Record<string, (typeof store.ASM)[string] | null> = {};
  [from, to].forEach((u) => {
    if (u != null) {
      const k = asKey(t.id, u);
      snap[k] = store.ASM[k] ? { ...store.ASM[k] } : null;
    }
  });
  update((s) => {
    if (from != null) {
      t.assg = t.assg.filter((x) => x !== from);
      const k = asKey(t.id, from);
      if (s.TIME.some((e) => e.task === t.id && e.user === from)) {
        const a = s.ASM[k] || (s.ASM[k] = { by: s.ME, at: off(0), start: null, end: null });
        a.end = a.end || off(0);
      } else delete s.ASM[k];
    }
    if (to != null) {
      t.assg.push(to);
      s.ASM[asKey(t.id, to)] = { by: s.ME, at: off(0), start: null, end: null };
    }
  });
  const ref = { tid: t.id, pid: t.project ?? undefined };
  logAudit(
    to != null ? "assigned" : "unassigned",
    "task",
    t.title,
    from != null && to != null
      ? "Przekazano: " + actorName(from) + " → " + actorName(to)
      : to != null
        ? "Przypisano: " + actorName(to)
        : "Odpięto: " + actorName(from),
    ref,
  );
  toast(
    to != null ? "Przekazano „" + t.title + "” → " + actorName(to) : "„" + t.title + "” jest teraz bez osoby",
    {
      label: "Cofnij",
      ms: 6000,
      fn: () => {
        update((s) => {
          t.assg = prev;
          for (const k in snap) {
            if (snap[k]) s.ASM[k] = snap[k]!;
            else delete s.ASM[k];
          }
        });
        logAudit("update", "task", t.title, "Cofnięto przekazanie", ref);
      },
    },
  );
  return true;
}

function Card({
  t,
  uid,
  W,
  menu,
  setMenu,
}: {
  t: Task;
  uid: number | "u";
  W: Workload;
  menu: string | null;
  setMenu: (k: string | null) => void;
}) {
  const k = t.id + ":" + uid;
  const open = menu === k;
  return (
    <div
      className="kcard"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", "w:" + t.id + ":" + uid);
        e.dataTransfer.effectAllowed = "move";
        e.currentTarget.classList.add("drag");
      }}
      onDragEnd={(e) => e.currentTarget.classList.remove("drag")}
    >
      <div className="kcard-top">
        <b>
          <TaskLink id={t.id}>{t.title}</TaskLink>
        </b>
        <button
          type="button"
          className="kmv"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={"Przekaż zadanie: " + t.title}
          onClick={(e) => {
            e.stopPropagation();
            setMenu(open ? null : k);
          }}
        >
          ⋯
        </button>
      </div>
      {open ? (
        <div className="kmenu" role="menu" aria-label="Przekaż do">
          {W.ppl
            .filter((y) => !y.inact && y.u.id !== uid && !t.assg.includes(y.u.id))
            .map((y) => (
              <button
                key={y.u.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenu(null);
                  reassign(t, uid === "u" ? null : uid, y.u.id);
                }}
              >
                {uname(y.u)} <span className="muted">· {fmtH(y.h)}</span>
              </button>
            ))}
          {uid !== "u" ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenu(null);
                reassign(t, uid, null);
              }}
            >
              Bez osoby
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="meta">
        <StatusChip task={t} />
        <PrioChip prio={t.prio} />
        <span className="meta-t">{fmtH(estH(t))}</span>
        {t.assg.length > 1 ? (
          <span className="meta-t">
            +{t.assg.length - 1} {plural(t.assg.length - 1, "osoba", "osoby", "osób")}
          </span>
        ) : null}
        {!t.assg.length && t.group ? <Chip c="sky">Pula: {gName(t.group)}</Chip> : null}
        <Due task={t} />
      </div>
    </div>
  );
}

function DropBody({
  col,
  disabled,
  children,
}: {
  col: number | "u";
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={"kcol-b" + (over ? " over" : "")}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const d = e.dataTransfer.getData("text/plain").split(":");
        if (d[0] !== "w" || disabled) return;
        const t = store.TASKS.find((x) => x.id === +d[1]);
        if (t) reassign(t, d[2] === "u" ? null : +d[2], col === "u" ? null : col);
      }}
    >
      {children}
    </div>
  );
}

export default function TeamTab() {
  useDemo();
  const p = projectOf(useParams().projectId);
  const [ai, setAi] = useState(true);
  const [skip, setSkip] = useState<string[]>([]);
  const [menu, setMenu] = useState<string | null>(null);

  useEffect(() => {
    if (menu == null) return;
    const close = () => setMenu(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("click", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  if (!p) return null;
  const W = workload(p);
  const recs = wlRecs(W, { ai, skip });
  const mx = Math.max(1, ...W.ppl.map((x) => x.h));
  const hot = W.ppl.filter((x) => x.hot).length;
  const people = W.ppl.slice().sort((a, b) => b.h - a.h);
  const kt = (l: string, v: React.ReactNode, c = "") => (
    <div className={"tm-k" + c}>
      <small>{l}</small>
      <b>{v}</b>
    </div>
  );

  return (
    <div className="mk">
      <div className="card">
        <div className="tm-top">
          <div>
            <b>Obciążenie zespołu</b>
            <div className="muted">
              Otwarte zadania projektu (do zrobienia i w toku) na osobę. Godziny z szacunku zadań, bez szacunku liczymy 4 h.
            </div>
          </div>
          <div className="tm-kpis">
            {kt("Osoby", W.ppl.filter((x) => !x.inact).length)}
            {kt("Otwarte zadania", W.ts.length)}
            {kt("Średnio na osobę", fmtH(Math.round(W.avg * 10) / 10))}
            {kt("Przeciążone", hot, hot ? " bad" : "")}
            {kt("Bez osoby", W.unas.length, W.unas.length ? " warn" : "")}
          </div>
        </div>
      </div>
      <div className="card ai">
        <div className="dc-h">
          <h2>Rekomendacje przesunięć</h2>
          <span className="row2">
            <Chip c="amber">Moduł AI · opcjonalny</Chip>
            <button type="button" className="mini" aria-pressed={ai} onClick={() => setAi(!ai)}>
              {ai ? "Wyłącz" : "Włącz"}
            </button>
          </span>
        </div>
        {!ai ? (
          <div className="muted">Rekomendacje są wyłączone. Obciążenie i ręczne przekazywanie działają bez nich.</div>
        ) : recs.length ? (
          <ul className="recs">
            {recs.map((r) => (
              <li key={r.t.id + ":" + r.from} className="rec">
                <div className="grow">
                  <b>
                    Przekaż „{r.t.title}”: {actorName(r.from)} → {actorName(r.to)}
                  </b>
                  <small>
                    {r.why} · {r.after}
                  </small>
                </div>
                <span className="row2">
                  <button type="button" className="mini pri" onClick={() => reassign(r.t, r.from, r.to)}>
                    Zastosuj
                  </button>
                  <button type="button" className="mini" onClick={() => setSkip([...skip, r.t.id + ":" + r.from])}>
                    Pomiń
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-s">Obciążenie jest wyrównane – brak propozycji.</div>
        )}
        <details className="dtl">
          <summary>Jak liczymy</summary>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            W makiecie propozycje liczy prosta reguła: przeciążona osoba ma co najmniej 3 zadania i ponad 130% średniej
            godzin, a zadanie (jeszcze nierozpoczęte) trafia do najmniej obciążonej osoby. W aplikacji zrobi to moduł AI;
            bez niego widok działa tak samo, tylko bez tej karty.
          </p>
        </details>
      </div>
      <div className="muted">
        Przeciągnij kartę na inną osobę albo użyj ⋯, aby przekazać zadanie. Kliknij tytuł, aby otworzyć szczegóły.
      </div>
      {!people.length && !W.unas.length ? (
        <EmptyState title="Brak zespołu" text="Nie ma jeszcze osób ani otwartych zadań w tym projekcie." />
      ) : null}
      <div className="kan-g wl-g" style={{ "--n": people.length + 1 } as React.CSSProperties}>
        {people.map((x) => (
          <div
            key={x.u.id}
            className={"kcol wl-col" + (x.hot ? " hot" : "")}
            style={{ "--ac": x.hot ? "#ef4444" : x.inact ? "#94a3b8" : "#6366f1" } as React.CSSProperties}
          >
            <div className="wl-h">
              <span className="av" aria-hidden="true">
                {initials(x.u)}
              </span>
              <div className="grow">
                <b title={uname(x.u)}>{uname(x.u)}</b>
                <small>
                  {x.n} {plural(x.n, "zadanie", "zadania", "zadań")} · {fmtH(x.h)}
                  {x.over ? (
                    <>
                      {" · "}
                      <span className="late">{x.over} po terminie</span>
                    </>
                  ) : null}
                </small>
                {x.hot ? <Chip c="red">Przeciążenie</Chip> : x.inact ? <Chip c="gray">Zawieszony</Chip> : null}
              </div>
            </div>
            <div className="prog-t" role="img" aria-label={"Obciążenie " + fmtH(x.h)}>
              <i style={{ width: Math.round((x.h / mx) * 100) + "%", background: "var(--ac)" }} />
            </div>
            <DropBody col={x.u.id} disabled={x.inact}>
              {x.ts.length ? (
                x.ts.map((t) => <Card key={t.id} t={t} uid={x.u.id} W={W} menu={menu} setMenu={setMenu} />)
              ) : (
                <div className="kempty">Brak otwartych zadań</div>
              )}
            </DropBody>
          </div>
        ))}
        <div className="kcol wl-col" style={{ "--ac": "#94a3b8" } as React.CSSProperties}>
          <div className="wl-h">
            <span className="av" aria-hidden="true" style={{ background: "#e2e8f0", color: "#475569" }}>
              ?
            </span>
            <div className="grow">
              <b>Bez osoby</b>
              <small>
                {W.unas.length} {plural(W.unas.length, "zadanie", "zadania", "zadań")} · w puli grup:{" "}
                {W.unas.filter((t) => t.group).length}
              </small>
            </div>
          </div>
          <div className="prog-t" aria-hidden="true">
            <i style={{ width: 0 }} />
          </div>
          <DropBody col="u">
            {W.unas.length ? (
              W.unas.map((t) => <Card key={t.id} t={t} uid="u" W={W} menu={menu} setMenu={setMenu} />)
            ) : (
              <div className="kempty">Wszystko przypisane</div>
            )}
          </DropBody>
        </div>
      </div>
    </div>
  );
}
