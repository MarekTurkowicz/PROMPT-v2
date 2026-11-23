// Port of mock.html vPMiles(), msForm() and msTaskRow().
import { useState } from "react";
import { MSL, base, msProg, parse, topLevel } from "@/demo/helpers";
import type { Milestone, Task } from "@/demo/data";
import { logAudit, nextId, store, update } from "@/demo/store";
import { Chip, Due, EmptyState, LabelChips, PrioChip, StatusChip, TaskLink, bad, openConfirm, openForm, toast } from "@/demo/ui";
import { SubBlock, useProject } from "./part1/shared";

function openMilestoneForm(m: Milestone | null, pid: number) {
  openForm(
    m ? "Edytuj etap" : "Nowy etap",
    [
      { id: "name", label: "Nazwa *", value: m?.name ?? "", required: 1, full: 1 },
      {
        id: "status",
        label: "Status",
        type: "select",
        options: Object.entries(MSL).map(([k, v]): [string, string] => [k, v[1]]),
        value: m?.status ?? "planned",
      },
      { id: "due", label: "Termin", type: "date", value: m?.due ?? "" },
      {
        id: "pos",
        label: "Kolejność",
        type: "number",
        value: m?.pos ?? store.MILES.filter((x) => x.project === pid).length + 1,
      },
    ],
    m ? "Zapisz" : "Dodaj",
    (v) => {
      const name = v.name.trim();
      if (!name) return bad("Podaj nazwę etapu.");
      const d = { name, status: v.status as Milestone["status"], due: v.due || null, pos: +v.pos || 1 };
      update((s) => {
        if (m) Object.assign(m, d);
        else s.MILES.push({ id: nextId("milestone"), project: pid, ...d });
      });
      logAudit(m ? "update" : "create", "milestone", name, "", { pid: m ? m.project : pid });
      toast(m ? "Zapisano etap" : "Dodano etap");
    },
  );
}

function deleteMilestone(m: Milestone) {
  const n = store.TASKS.filter((t) => t.ms === m.id).length;
  openConfirm(`Usunąć etap „${m.name}”?${n ? " Zadania etapu (" + n + ") zostaną bez etapu." : ""}`, () => {
    update((s) => {
      s.MILES.splice(s.MILES.indexOf(m), 1);
      s.TASKS.forEach((t) => {
        if (t.ms === m.id) t.ms = null;
      });
    });
    logAudit("delete", "milestone", m.name, "", { pid: m.project });
    toast("Usunięto etap");
  });
}

function MsTaskRow({ t }: { t: Task }) {
  const subs = store.TASKS.filter((x) => x.parent === t.id);
  return (
    <div className="tk tk-ms">
      <TaskLink id={t.id}>
        <b>{t.title}</b>
      </TaskLink>
      <div className="meta">
        <StatusChip task={t} />
        <PrioChip prio={t.prio} />
        <LabelChips task={t} />
        <Due task={t} />
      </div>
      {subs.length ? <SubBlock subs={subs} /> : null}
    </div>
  );
}

export default function MilestonesTab() {
  const p = useProject();
  const [openId, setOpenId] = useState<number | null>(null);
  if (!p) return <div className="mk"><EmptyState title="Nie znaleziono projektu" text="Wróć do listy projektów." /></div>;

  const ms = store.MILES.filter((m) => m.project === p.id).sort((a, b) => a.pos - b.pos);
  const noMs = store.TASKS.filter((t) => t.project === p.id && !t.ms).length;
  return (
    <div className="mk">
      <div className="lp-head" style={{ padding: 0 }}>
        <span className="muted">Postęp etapu = zadania zrobione / wszystkie zadania etapu (bez anulowanych).</span>
        <button type="button" className="btn-primary" onClick={() => openMilestoneForm(null, p.id)}>
          Dodaj etap
        </button>
      </div>
      <div>
        {ms.length ? (
          ms.map((m) => {
            const g = msProg(m);
            const late = !!m.due && m.status !== "done" && parse(m.due)! < base;
            const open = openId === m.id;
            const ts = store.TASKS.filter((t) => t.ms === m.id);
            const [c, label] = MSL[m.status];
            return (
              <div className="ms" key={m.id}>
                <div className="ms-h">
                  <div>
                    <b>{m.name}</b> <Chip c={c}>{label}</Chip> {late ? <Chip c="red">Po terminie</Chip> : null}
                    <div className="meta-t">
                      Termin: {m.due || "—"} · zadania zrobione: {g.d}/{g.n}
                    </div>
                  </div>
                  <div className="row2">
                    <button type="button" className="mini" aria-expanded={open} onClick={() => setOpenId(open ? null : m.id)}>
                      {open ? "Ukryj zadania" : "Pokaż zadania"}
                    </button>
                    <button type="button" className="mini" onClick={() => openMilestoneForm(m, m.project)}>
                      Edytuj
                    </button>
                    <button type="button" className="mini dang" onClick={() => deleteMilestone(m)}>
                      Usuń
                    </button>
                  </div>
                </div>
                <div className="prog" style={{ margin: "10px 0 0" }}>
                  <div className="prog-l">
                    <span>Postęp</span>
                    <b>{g.pct}%</b>
                  </div>
                  <div className="prog-t">
                    <i style={{ width: g.pct + "%", background: m.status === "done" ? "#22c55e" : "#6366f1" }} />
                  </div>
                </div>
                {open ? (
                  <div className="tk-list" style={{ marginTop: 10 }}>
                    {topLevel(ts).length ? (
                      topLevel(ts).map((t) => <MsTaskRow key={t.id} t={t} />)
                    ) : (
                      <div className="empty-s">Brak zadań w etapie.</div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <EmptyState title="Projekt nie ma etapów" text="Podziel projekt na etapy, aby śledzić postęp w czasie." />
        )}
      </div>
      {noMs ? <div className="muted">Zadania bez etapu: {noMs}. Etap ustawisz w szczegółach zadania.</div> : null}
    </div>
  );
}
