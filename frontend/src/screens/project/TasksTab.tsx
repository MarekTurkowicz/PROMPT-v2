// Port of mock.html vPTasks(). Status filter can be preset with ?f=<key> (used by the overview risk radar).
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Task } from "@/demo/data";
import { gName, hasLbl, inPool, isOverdue, pName, fName, topLevel } from "@/demo/helpers";
import { store } from "@/demo/store";
import { Chip, Due, EmptyState, LabelChips, PrioChip, StatusChip, TaskLink } from "@/demo/ui";
import { deleteTask, openTaskForm, takeFromPool } from "@/demo/tasks";
import { LabelFilter, SubBlock, openLabelForm, useProject } from "./part1/shared";

const FLT: Record<string, (t: Task) => boolean> = {
  all: () => true,
  cancelled: (t) => t.status === "cancelled",
  todo: (t) => t.status === "todo",
  doing: (t) => t.status === "doing",
  done: (t) => t.status === "done",
  overdue: (t) => !!isOverdue(t),
  high: (t) => t.prio >= 4 && t.status !== "done",
  highover: (t) => t.prio >= 4 && !!isOverdue(t),
  nodates: (t) => !t.start || !t.due,
};
const FLB: Record<string, string> = {
  high: "Wysoki priorytet",
  highover: "Po terminie, wysoki priorytet",
  nodates: "Brak dat",
};

function TaskCard({ t }: { t: Task }) {
  const subs = store.TASKS.filter((x) => x.parent === t.id);
  const ck = store.CHECK.filter((c) => c.task === t.id);
  const par = t.parent ? store.TASKS.find((x) => x.id === t.parent) : undefined;
  return (
    <div className="item">
      <div className="item-top">
        <div>
          <h3>
            <TaskLink id={t.id}>{t.title}</TaskLink>
          </h3>
          {t.desc ? <p className="desc">{t.desc}</p> : null}
          <div className="meta">
            <StatusChip task={t} up />
            <PrioChip prio={t.prio} />
            {t.mand ? <Chip c="red">Obowiązkowe</Chip> : null}
            <LabelChips task={t} />
            {t.group && !t.assg.length ? <Chip c="sky">{"Pula: " + gName(t.group)}</Chip> : null}
            {t.project ? <span className="meta-t">• Projekt: {pName(t.project)}</span> : null}
            {t.funding ? <span className="meta-t">• Finansowanie: {fName(t.funding)}</span> : null}
            {par ? <span className="meta-t">• Podzadanie: {par.title}</span> : null}
            {ck.length ? (
              <span className="meta-t">
                • Checklisty: {ck.filter((c) => c.doneBy).length}/{ck.length}
              </span>
            ) : null}
            <Due task={t} />
          </div>
        </div>
        <div className="item-act">
          {inPool(t) ? (
            <button type="button" className="btn-indigo" onClick={() => takeFromPool(t)}>
              Weź zadanie
            </button>
          ) : null}
          <button type="button" className="btn" onClick={() => openTaskForm(t)}>
            Edytuj
          </button>
          <button type="button" className="btn-danger" onClick={() => deleteTask(t)}>
            Usuń
          </button>
        </div>
      </div>
      {subs.length ? <SubBlock subs={subs} /> : null}
    </div>
  );
}

export default function TasksTab() {
  const p = useProject();
  const [params] = useSearchParams();
  const [status, setStatus] = useState(() => (params.get("f") && FLT[params.get("f")!] ? params.get("f")! : "all"));
  const [label, setLabel] = useState("");
  if (!p) return <div className="mk"><EmptyState title="Nie znaleziono projektu" text="Wróć do listy projektów." /></div>;

  const ts = store.TASKS.filter((t) => t.project === p.id).filter(FLT[status] ?? FLT.all).filter((t) => hasLbl(t, label));
  const btn = (k: string, l: string) => (
    <button key={k} type="button" className={"chip-btn" + (status === k ? " on" : "")} onClick={() => setStatus(k)}>
      {l}
    </button>
  );
  const add = (
    <button type="button" className="btn-primary" onClick={() => openTaskForm(null, { project: p.id })}>
      Dodaj zadanie
    </button>
  );
  return (
    <div className="mk">
      <div className="lp-head" style={{ padding: 0 }}>
        <div className="chips">
          {btn("all", "Wszystkie")}
          {btn("todo", "Do zrobienia")}
          {btn("doing", "W toku")}
          {btn("done", "Zrobione")}
          {btn("overdue", "Po terminie")}
          {FLB[status] ? btn(status, FLB[status]) : null}
        </div>
        <div className="row2">
          <LabelFilter value={label} onChange={setLabel} />
          <button type="button" className="btn" style={{ borderColor: "#e2e8f0" }} onClick={openLabelForm}>
            + Etykieta
          </button>
          {add}
        </div>
      </div>
      {ts.length ? (
        <div className="list" style={{ margin: 0 }}>
          {topLevel(ts).map((t) => (
            <TaskCard key={t.id} t={t} />
          ))}
        </div>
      ) : status === "all" && !label ? (
        <EmptyState
          title="Ten projekt nie ma jeszcze zadań"
          text="Dodaj pierwsze zadanie, aby zobaczyć je na tablicy, osi czasu i w obciążeniu zespołu."
        >
          {add}
        </EmptyState>
      ) : (
        <EmptyState title="Brak zadań dla tego filtra" text="Żadne zadanie projektu nie spełnia wybranego warunku.">
          <button
            type="button"
            className="btn"
            onClick={() => {
              setStatus("all");
              setLabel("");
            }}
          >
            Pokaż wszystkie
          </button>
        </EmptyState>
      )}
    </div>
  );
}
