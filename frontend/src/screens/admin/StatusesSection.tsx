// Port of mock.html aStatuses(), statusForm and the st-* actions.
import { Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { CAT, type StatusCat } from "@/demo/core";
import type { Status } from "@/demo/data";
import { pName, setSid } from "@/demo/helpers";
import { logAudit, nextId, store, update, useDemo } from "@/demo/store";
import { bad, openConfirm, openForm, toast } from "@/demo/ui";

function statusForm(s?: Status, project: number | null = null) {
  openForm(
    s ? "Edytuj status" : project != null ? "Nowy status projektu" : "Nowy status organizacji",
    [
      { id: "name", label: "Nazwa *", value: s?.name || "", required: 1, full: 1 },
      { id: "cat", label: "Kategoria", type: "select", options: Object.entries(CAT), value: s?.cat || "in_progress" },
      { id: "color", label: "Kolor (#RRGGBB)", value: s?.color || "#6366f1" },
      { id: "pos", label: "Pozycja", type: "number", value: s?.pos ?? store.STATUSES.length + 1 },
    ],
    s ? "Zapisz" : "Dodaj",
    (v) => {
      const name = v.name.trim();
      const pr = s ? s.project : project;
      const color = v.color.trim();
      if (!/^#[0-9a-fA-F]{6}$/.test(color)) return bad("Kolor musi mieć format #RRGGBB.");
      if (store.STATUSES.some((x) => x !== s && x.project === pr && x.name.toLowerCase() === name.toLowerCase()))
        return bad("Status o tej nazwie już istnieje w tym zakresie.");
      if (s && s.cat !== v.cat && store.TASKS.some((t) => t.sid === s.id)) return bad("Nie można zmienić kategorii statusu, w którym są zadania.");
      const d = { name, cat: v.cat as StatusCat, color: color.toLowerCase(), pos: +v.pos || 1 };
      update((st) => {
        if (s) {
          Object.assign(s, d);
          st.TASKS.forEach((t) => {
            if (t.sid === s.id) setSid(t, s.id);
          });
        } else st.STATUSES.push({ id: nextId("status"), org: st.orgId, project: pr, def: false, active: true, ...d });
      });
      logAudit(s ? "update" : "create", "status", name, pr != null ? "Projekt „" + pName(pr) + "”" : "", pr != null ? { pid: pr } : {});
      toast(s ? "Zapisano status" : "Dodano status");
    },
  );
}

function delStatus(s: Status) {
  const n = store.TASKS.filter((t) => t.sid === s.id).length;
  if (n) return toast(`Nie można usunąć statusu „${s.name}” – są w nim zadania (${n}).`);
  if (s.def) return toast("Nie można usunąć statusu domyślnego.");
  openConfirm(`Usunąć status „${s.name}”?`, () => {
    update((st) => {
      st.STATUSES.splice(st.STATUSES.indexOf(s), 1);
      st.PROJECTS.forEach((p) => {
        p.hidden = (p.hidden || []).filter((x) => x !== s.id);
      });
    });
    logAudit("delete", "status", s.name);
    toast("Usunięto status");
  });
}

function move(org: Status[], id: number, d: number) {
  const i = org.findIndex((s) => s.id === id);
  const j = i + d;
  if (j < 0 || j >= org.length) return;
  update(() => {
    [org[i], org[j]] = [org[j], org[i]];
    org.forEach((s, k) => {
      s.pos = k + 1;
    });
  });
}

function makeDefault(s: Status) {
  if (!s.active) return toast("Status domyślny musi być aktywny.");
  update((st) =>
    st.STATUSES.forEach((x) => {
      if (x.project == null) x.def = x.id === s.id;
    }),
  );
  logAudit("update", "status", s.name, "Ustawiono jako domyślny");
  toast("Status domyślny: " + s.name);
}

function toggleActive(s: Status) {
  if (s.active) {
    if (s.def) return toast("Nie można wyłączyć statusu domyślnego.");
    const n = store.TASKS.filter((t) => t.sid === s.id).length;
    if (n) return toast(`Nie można wyłączyć – w statusie są zadania (${n}).`);
  }
  update(() => {
    s.active = !s.active;
  });
}

export default function StatusesSection() {
  const st = useDemo();
  const org = st.STATUSES.filter((s) => s.project == null).sort((a, b) => a.pos - b.pos);
  const prj = st.STATUSES.filter((s) => s.project != null);
  const cnt = (s: Status) => st.TASKS.filter((t) => t.sid === s.id).length;
  return (
    <div className="mk">
      <header className="ah">
        <div>
          <h1>
            Statusy zadań <span className="cnt">{st.STATUSES.length}</span>
          </h1>
          <p>
            Statusy organizacji widzą wszystkie projekty. Każdy status należy do jednej z 4 stałych kategorii, od których zależą postęp i
            zaległości.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => statusForm()}>
          + Dodaj status
        </button>
      </header>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Kolejność</th>
              <th>Status</th>
              <th>Kategoria</th>
              <th>Kolor</th>
              <th className="ta-c">Domyślny</th>
              <th className="ta-c">Aktywny</th>
              <th className="ta-c">Zadania</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {org.map((s, i) => (
              <tr key={s.id}>
                <td>
                  <button type="button" className="ab" aria-label={"Przesuń wyżej: " + s.name} disabled={!i} onClick={() => move(org, s.id, -1)}>
                    ↑
                  </button>
                  <button type="button" className="ab" aria-label={"Przesuń niżej: " + s.name} disabled={i >= org.length - 1} onClick={() => move(org, s.id, 1)}>
                    ↓
                  </button>
                </td>
                <td>
                  <span className="sdot" style={{ background: s.color }}></span>
                  <b>{s.name}</b>
                </td>
                <td>{CAT[s.cat]}</td>
                <td>
                  <code>{s.color}</code>
                </td>
                <td className="ta-c">
                  <input type="radio" name="stdef" aria-label={"Status domyślny: " + s.name} checked={s.def} onChange={() => makeDefault(s)} />
                </td>
                <td className="ta-c">
                  <input type="checkbox" aria-label={"Aktywny: " + s.name} checked={s.active} onChange={() => toggleActive(s)} />
                </td>
                <td className="ta-c">{cnt(s)}</td>
                <td className="ta-r">
                  <button type="button" className="ab" aria-label={"Edytuj " + s.name} onClick={() => statusForm(s)}>
                    <Pencil size={16} />
                  </button>
                  <button type="button" className="ab" aria-label={"Usuń " + s.name} onClick={() => delStatus(s)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="sh">Statusy projektów</h2>
        {prj.length ? (
          <div className="tk-list">
            {prj.map((s) => (
              <div key={s.id} className="tk">
                <div>
                  <span className="sdot" style={{ background: s.color }}></span>
                  <b>{s.name}</b>{" "}
                  <span className="muted">
                    {CAT[s.cat]} · projekt „{pName(s.project)}”
                  </span>
                </div>
                <Link className="mini" to={`/projects/${s.project}/settings`}>
                  Ustawienia projektu
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-s">Żaden projekt nie ma własnych statusów.</div>
        )}
      </section>
    </div>
  );
}
