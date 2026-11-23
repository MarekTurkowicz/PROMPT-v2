// Port of mock.html vPKanban() with native HTML5 drag and drop and the "⋯" move menu.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import type { Status, Task } from "@/demo/data";
import { PR_PL, hasLbl, sortBy, visSt } from "@/demo/helpers";
import { store } from "@/demo/store";
import { Chip, Due, EmptyState, LabelChips, PrioChip, TaskLink } from "@/demo/ui";
import { LabelFilter, LblProp, changeStatus, openLabelForm, openTaskAdd, useProject } from "./part1/shared";

function Card({
  t,
  cols,
  menu,
  setMenu,
  setDrag,
  dragging,
}: {
  t: Task;
  cols: Status[];
  menu: number | null;
  setMenu: (id: number | null) => void;
  setDrag: (id: number | null) => void;
  dragging: boolean;
}) {
  const open = menu === t.id;
  const btn = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) first.current?.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus();
  }, [open]);
  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setMenu(null);
      btn.current?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const it = [...(first.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not([disabled])") ?? [])];
    if (!it.length) return;
    e.preventDefault();
    const i = it.indexOf(document.activeElement as HTMLButtonElement);
    const j = e.key === "Home" ? 0 : e.key === "End" ? it.length - 1 : e.key === "ArrowDown" ? (i + 1) % it.length : (i - 1 + it.length) % it.length;
    it[j].focus();
  };
  return (
    <div
      className={"kcard" + (dragging ? " drag" : "")}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(t.id));
        e.dataTransfer.effectAllowed = "move";
        setDrag(t.id);
      }}
      onDragEnd={() => setDrag(null)}
    >
      <div className="kcard-top">
        <b>
          <TaskLink id={t.id}>{t.title}</TaskLink>
        </b>
        <button
          ref={btn}
          type="button"
          className="kmv"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={"Przenieś zadanie: " + t.title}
          onClick={(e) => {
            e.stopPropagation();
            setMenu(open ? null : t.id);
          }}
        >
          <MoreHorizontal size={16} aria-hidden="true" />
        </button>
      </div>
      {open ? (
        <div className="kmenu" role="menu" aria-label="Przenieś do" ref={first} onKeyDown={onMenuKey} onClick={(e) => e.stopPropagation()}>
          {cols.map((s) => (
            <button
              key={s.id}
              type="button"
              role="menuitem"
              disabled={t.sid === s.id}
              aria-current={t.sid === s.id ? "true" : undefined}
              onClick={() => {
                setMenu(null);
                changeStatus(t, s.id);
                btn.current?.focus();
              }}
            >
              <span className="sdot" style={{ background: s.color }} />
              {s.name}
            </button>
          ))}
        </div>
      ) : null}
      {t.desc ? <p>{t.desc}</p> : null}
      <div className="meta">
        <PrioChip prio={t.prio} />
        {t.mand ? <Chip c="red">Obowiązkowe</Chip> : null}
        <LabelChips task={t} />
        {t.group && !t.assg.length ? <Chip c="sky">Pula grupy</Chip> : null}
        <Due task={t} />
      </div>
    </div>
  );
}

export default function KanbanTab() {
  const p = useProject();
  const [q, setQ] = useState("");
  const [prios, setPrios] = useState<number[]>([]);
  const [label, setLabel] = useState("");
  const [menu, setMenu] = useState<number | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (menu == null) return;
    const close = () => setMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menu]);

  if (!p) return <div className="mk"><EmptyState title="Nie znaleziono projektu" text="Wróć do listy projektów." /></div>;

  const cols = visSt(p.id);
  const query = q.trim().toLowerCase();
  const ts = sortBy(
    store.TASKS.filter((t) => t.project === p.id),
    "-priority",
    { priority: (t) => t.prio },
  ).filter((t) => (!query || t.title.toLowerCase().includes(query)) && (!prios.length || prios.includes(t.prio)) && hasLbl(t, label));
  const active = (query ? 1 : 0) + (prios.length ? 1 : 0) + (label ? 1 : 0);
  const hid = (p.hidden || []).length;
  const togglePrio = (n: number) => setPrios(prios.includes(n) ? prios.filter((x) => x !== n) : [...prios, n]);

  return (
    <div className="mk">
      <div className="kan">
        <div className="kan-bar">
          <div className="kan-l">
            <input
              ref={search}
              className="form-input"
              id="ksearch"
              style={{ height: 36 }}
              placeholder="Szukaj zadania…"
              aria-label="Szukaj zadania"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="seg" role="group" aria-label="Filtr priorytetu">
              <button type="button" className={prios.length ? "" : "on"} onClick={() => setPrios([])}>
                Wszystkie
              </button>
              {[5, 4, 3, 2, 1].map((i) => (
                <button key={i} type="button" className={prios.includes(i) ? "on" : ""} aria-pressed={prios.includes(i)} onClick={() => togglePrio(i)}>
                  {PR_PL[i]}
                </button>
              ))}
            </div>
            <LabelFilter value={label} onChange={setLabel} />
            {active ? (
              <button
                type="button"
                className="lnk"
                style={{ margin: 0 }}
                onClick={() => {
                  setQ("");
                  setPrios([]);
                  setLabel("");
                  search.current?.focus();
                }}
              >
                Wyczyść filtry ({active})
              </button>
            ) : null}
          </div>
          <div className="row2">
            <button type="button" className="btn" style={{ borderColor: "#e2e8f0" }} onClick={openLabelForm}>
              + Etykieta
            </button>
            <button type="button" className="btn-dark" onClick={() => openTaskAdd(p.id)}>
              + Dodaj zadanie
            </button>
          </div>
        </div>
        <div className="muted">
          Kolumny to statusy widoczne w projekcie
          {hid ? (
            <>
              {" "}
              (ukryte: {hid} – zmienisz w <Link to={`/projects/${p.id}/settings`}>ustawieniach projektu</Link>)
            </>
          ) : null}
          . Przeciągnij kartę albo użyj ⋯, aby zmienić status. Kliknij tytuł, aby otworzyć szczegóły. Etykiety: <LblProp />
        </div>
        <div className="kan-g" style={{ "--n": cols.length } as React.CSSProperties}>
          {cols.map((s) => {
            const l = ts.filter((t) => t.sid === s.id);
            return (
              <div key={s.id} className="kcol" style={{ "--ac": s.color, background: `color-mix(in srgb,${s.color} 6%,#fff)` } as React.CSSProperties}>
                <div className="kcol-h">
                  <b>{s.name}</b>
                  <span>{l.length}</span>
                </div>
                {s.project ? (
                  <div className="meta-t" style={{ margin: "-4px 0 8px" }}>
                    Status tylko tego projektu
                  </div>
                ) : null}
                <div
                  className={"kcol-b" + (over === s.id ? " over" : "")}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOver(s.id);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setOver(null);
                    const t = store.TASKS.find((x) => x.id === +e.dataTransfer.getData("text/plain"));
                    if (t) changeStatus(t, s.id);
                  }}
                >
                  {l.map((t) => (
                    <Card key={t.id} t={t} cols={cols} menu={menu} setMenu={setMenu} setDrag={setDrag} dragging={drag === t.id} />
                  ))}
                  {l.length ? null : <div className="kempty">Brak zadań</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
