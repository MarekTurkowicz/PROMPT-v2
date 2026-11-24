import { useParams } from "react-router-dom";
import { CAT } from "@/demo/core";
import type { Status } from "@/demo/data";
import { pName, projectOf, stById } from "@/demo/helpers";
import { logAudit, nextId, store, update, useDemo } from "@/demo/store";
import { Chip, bad, openConfirm, openForm, toast } from "@/demo/ui";

function statusForm(project: number) {
  openForm(
    "Nowy status projektu",
    [
      { id: "name", label: "Nazwa *", value: "", required: 1, full: 1 },
      { id: "cat", label: "Kategoria", type: "select", options: Object.entries(CAT), value: "in_progress" },
      { id: "color", label: "Kolor (#RRGGBB)", value: "#6366f1" },
      { id: "pos", label: "Pozycja", type: "number", value: store.STATUSES.length + 1 },
    ],
    "Dodaj",
    (v) => {
      const name = v.name.trim();
      if (!/^#[0-9a-fA-F]{6}$/.test(v.color.trim())) return bad("Kolor musi mieć format #RRGGBB.");
      if (store.STATUSES.some((x) => x.project === project && x.name.toLowerCase() === name.toLowerCase())) {
        return bad("Status o tej nazwie już istnieje w tym zakresie.");
      }
      const st: Status = {
        id: nextId("status"),
        org: store.orgId,
        project,
        cat: v.cat as Status["cat"],
        name,
        color: v.color.trim().toLowerCase(),
        pos: +v.pos || 1,
        def: false,
        active: true,
      };
      update((s) => {
        s.STATUSES.push(st);
      });
      logAudit("create", "status", name, "Projekt „" + pName(project) + "”", { pid: project });
      toast("Dodano status");
    },
  );
}

function toggleHidden(pid: number, sid: number) {
  const p = store.PROJECTS.find((x) => x.id === pid)!;
  const s = stById(sid)!;
  if (p.hidden.includes(s.id)) {
    update(() => {
      p.hidden = p.hidden.filter((x) => x !== s.id);
    });
    logAudit("shown", "project", p.name, "Pokazano status „" + s.name + "”", { pid });
    return;
  }
  const n = store.TASKS.filter((t) => t.project === pid && t.sid === s.id).length;
  if (n) return toast(`W statusie „${s.name}” są zadania projektu (${n}). Przenieś je przed ukryciem.`);
  if (s.def) return toast("To status domyślny organizacji – zadania z szablonów trafiłyby do niewidocznego statusu.");
  update(() => {
    p.hidden.push(s.id);
  });
  logAudit("hidden", "project", p.name, "Ukryto status „" + s.name + "”", { pid });
  toast("Status ukryty w projekcie");
}

function delStatus(sid: number) {
  const s = stById(sid)!;
  const n = store.TASKS.filter((t) => t.sid === s.id).length;
  if (n) return toast(`Nie można usunąć statusu „${s.name}” – są w nim zadania (${n}).`);
  if (s.def) return toast("Nie można usunąć statusu domyślnego.");
  openConfirm(`Usunąć status „${s.name}”?`, () => {
    update((st) => {
      st.STATUSES.splice(st.STATUSES.indexOf(s), 1);
      st.PROJECTS.forEach((p) => {
        p.hidden = p.hidden.filter((x) => x !== s.id);
      });
    });
    logAudit("delete", "status", s.name);
    toast("Usunięto status");
  });
}

export default function SettingsTab() {
  const s = useDemo();
  const p = projectOf(useParams().projectId);
  if (!p) return null;
  const org = s.STATUSES.filter((x) => x.project == null && x.active).sort((a, b) => a.pos - b.pos);
  const own = s.STATUSES.filter((x) => x.project === p.id).sort((a, b) => a.pos - b.pos);
  const cnt = (st: Status) => s.TASKS.filter((t) => t.project === p.id && t.sid === st.id).length;

  return (
    <div className="mk">
      <div className="two" style={{ margin: 0 }}>
        <section className="card">
          <h2 className="sh">Statusy organizacji w tym projekcie</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Ukryty status znika z tablicy i formularzy tego projektu. Nie można ukryć statusu, w którym są zadania projektu.
          </p>
          <div className="tk-list">
            {org.map((st) => {
              const hid = (p.hidden || []).includes(st.id);
              return (
                <div key={st.id} className="tk">
                  <div>
                    <span className="sdot" style={{ background: st.color }} />
                    <b>{st.name}</b>{" "}
                    <span className="muted">
                      {CAT[st.cat]}
                      {st.def ? " · domyślny" : ""} · zadań: {cnt(st)}
                    </span>
                    {hid ? <> <Chip c="gray">Ukryty</Chip></> : null}
                  </div>
                  <button type="button" className="mini" onClick={() => toggleHidden(p.id, st.id)}>
                    {hid ? "Pokaż w projekcie" : "Ukryj w projekcie"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
        <section className="card">
          <h2 className="sh">Statusy tylko tego projektu</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Dodatkowe kolumny tablicy, np. testy u klienta.
          </p>
          <div className="tk-list">
            {own.length ? (
              own.map((st) => (
                <div key={st.id} className="tk">
                  <div>
                    <span className="sdot" style={{ background: st.color }} />
                    <b>{st.name}</b>{" "}
                    <span className="muted">
                      {CAT[st.cat]} · zadań: {cnt(st)}
                    </span>
                  </div>
                  <button type="button" className="mini dang" onClick={() => delStatus(st.id)}>
                    Usuń
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-s">Brak statusów projektu.</div>
            )}
          </div>
          <div style={{ marginTop: 10 }}>
            <button type="button" className="btn-primary" onClick={() => statusForm(p.id)}>
              Dodaj status projektu
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
