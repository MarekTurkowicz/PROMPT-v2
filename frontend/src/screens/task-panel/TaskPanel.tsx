import { useEffect, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { AL, ATT_OK, CAT, EL, PR_PL, ago, base, fmt, fmtH, fsize, off, plural } from "@/demo/core";
import type { ChecklistItem, Task } from "@/demo/data";
import {
  activeMem,
  actorName,
  fName,
  gName,
  inPool,
  isOverdue,
  lblOf,
  memUsers,
  msName,
  pName,
  uname,
  visSt,
} from "@/demo/helpers";
import { logAudit, nextId, openTask, store, update, useDemo } from "@/demo/store";
import { Avatar, Chip, Prop, PrioChip, StatusChip, bad, openForm, toast } from "@/demo/ui";
import { attErr } from "./CommentThread";
import CommentThread from "./CommentThread";
import { addSubtask, changeStatus, deleteTask, taskEditForm } from "./taskActions";

const asKey = (t: number, u: number) => t + ":" + u;
const DEF_LIST = "Checklista";
type Asm = { by: number; at: string | null; start: string | null; end: string | null; pool?: boolean };

function CheckRow({ c, i, n }: { c: ChecklistItem; i: number; n: number }) {
  const opts = memUsers().filter((u) => activeMem(u.id) || u.id === c.assignee);
  const tk = store.TASKS.find((x) => x.id === c.task);
  const ref = tk ? { tid: tk.id, pid: tk.project ?? undefined } : {};
  const toggle = () => {
    update(() => {
      if (c.doneBy) {
        c.doneBy = null;
        c.doneAt = null;
      } else {
        c.doneBy = store.ME;
        c.doneAt = new Date();
      }
    });
    logAudit(c.doneBy ? "checked" : "unchecked", "checklist_item", c.text, "Zadanie „" + (tk ? tk.title : "—") + "”", ref);
  };
  const move = (d: number) => {
    const key = (x: ChecklistItem) => x.list || DEF_LIST;
    const all = store.CHECK.filter((x) => x.task === c.task).sort((a, b) => a.order - b.order);
    const list = all.filter((x) => key(x) === key(c));
    const j = list.indexOf(c) + d;
    if (j < 0 || j >= list.length) return;
    update(() => {
      const a = all.indexOf(c);
      const b = all.indexOf(list[j]);
      [all[a], all[b]] = [all[b], all[a]];
      all.forEach((x, k) => {
        x.order = k + 1;
      });
    });
  };
  return (
    <div className="ck-row">
      <label className={"ck" + (c.doneBy ? " dn" : "")}>
        <input type="checkbox" checked={!!c.doneBy} onChange={toggle} />
        <div className="ck-t">
          <span>{c.text}</span>
          {c.doneBy ? (
            <small>
              {actorName(c.doneBy)} · {ago(c.doneAt!)}
            </small>
          ) : null}
        </div>
      </label>
      <select
        className="ck-as"
        aria-label={"Osoba odpowiedzialna: " + c.text}
        value={c.assignee ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          update(() => {
            c.assignee = v === "" ? null : +v;
          });
          logAudit("update", "checklist_item", c.text, "Osoba odpowiedzialna: " + (c.assignee ? actorName(c.assignee) : "brak"), ref);
        }}
      >
        <option value="">— osoba —</option>
        {opts.map((u) => (
          <option key={u.id} value={u.id}>
            {uname(u)}
          </option>
        ))}
      </select>
      <button type="button" className="ab" aria-label={"Przesuń wyżej: " + c.text} disabled={!i} onClick={() => move(-1)}>
        ↑
      </button>
      <button type="button" className="ab" aria-label={"Przesuń niżej: " + c.text} disabled={i >= n - 1} onClick={() => move(1)}>
        ↓
      </button>
      <button
        type="button"
        className="ab"
        aria-label={"Usuń punkt: " + c.text}
        onClick={() => update((s) => s.CHECK.splice(s.CHECK.indexOf(c), 1))}
      >
        ×
      </button>
    </div>
  );
}

function Main({ t }: { t: Task }) {
  const [sub, setSub] = useState("");
  const [ckText, setCkText] = useState("");
  const [ckList, setCkList] = useState("");
  const subs = store.TASKS.filter((x) => x.parent === t.id);
  const ck = store.CHECK.filter((c) => c.task === t.id).sort((a, b) => a.order - b.order);
  const lists = [...new Set(ck.map((c) => c.list || DEF_LIST))];
  const cms = store.COMS.filter((c) => c.task === t.id);
  const hist = store.AUD.filter((a) => a.tid === t.id).slice(0, 8);
  const listVal = ckList || lists[0] || DEF_LIST;

  const addCk = () => {
    const v = ckText.trim();
    if (!v) {
      toast("Wpisz treść punktu.");
      return;
    }
    update((s) => {
      s.CHECK.push({
        id: nextId("check"),
        task: t.id,
        list: listVal.trim() || DEF_LIST,
        text: v,
        order: Math.max(0, ...s.CHECK.filter((c) => c.task === t.id).map((c) => c.order)) + 1,
        assignee: null,
        doneBy: null,
        doneAt: null,
      });
    });
    setCkText("");
  };

  return (
    <>
      <section className="td-sec">
        <h3>Opis</h3>
        {t.desc ? <p style={{ margin: 0, color: "#334155" }}>{t.desc}</p> : <div className="empty-s">Brak opisu.</div>}
      </section>
      <section className="td-sec">
        <h3>
          Podzadania{" "}
          <small>
            {subs.filter((x) => x.status === "done").length}/{subs.length} zrobionych
          </small>
        </h3>
        {subs.map((x) => (
          <div key={x.id} className="sub">
            <button type="button" className="tlink" onClick={() => openTask(x.id)}>
              {x.title}
            </button>
            <span className="row2">
              <StatusChip task={x} />
              {x.assg.map((u) => (
                <Avatar key={u} id={u} small />
              ))}
              {!x.assg.length && x.group ? <Chip c="sky">Pula</Chip> : null}
            </span>
          </div>
        ))}
        {t.parent ? (
          <div className="muted">To jest podzadanie.</div>
        ) : (
          <form
            className="row2"
            onSubmit={(e) => {
              e.preventDefault();
              if (addSubtask(t, sub)) setSub("");
            }}
          >
            <input className="td-in" placeholder="Tytuł nowego podzadania" aria-label="Tytuł nowego podzadania" value={sub} onChange={(e) => setSub(e.target.value)} />
            <button type="submit" className="mini">
              Dodaj
            </button>
          </form>
        )}
      </section>
      <section className="td-sec">
        <h3>
          Checklisty{" "}
          <small>
            {ck.filter((c) => c.doneBy).length}/{ck.length} odhaczonych
          </small>
        </h3>
        {lists.map((l) => {
          const it = ck.filter((c) => (c.list || DEF_LIST) === l);
          return (
            <div key={l} className="ckl">
              <div className="ckl-h">
                <span>{l}</span>
                <span className="muted">
                  {it.filter((c) => c.doneBy).length}/{it.length}
                </span>
              </div>
              {it.map((c, i) => (
                <CheckRow key={c.id} c={c} i={i} n={it.length} />
              ))}
            </div>
          );
        })}
        <form
          className="row2"
          onSubmit={(e) => {
            e.preventDefault();
            addCk();
          }}
        >
          <input className="td-in" placeholder="Nowy punkt" aria-label="Treść nowego punktu" value={ckText} onChange={(e) => setCkText(e.target.value)} />
          <input className="td-in" list="td-ckls" aria-label="Nazwa checklisty" value={listVal} onChange={(e) => setCkList(e.target.value)} style={{ maxWidth: 170 }} />
          <datalist id="td-ckls">
            {lists.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          <button type="submit" className="mini">
            Dodaj
          </button>
        </form>
      </section>
      <section className="td-sec">
        <h3>
          Komentarze <small>{cms.length}</small>
        </h3>
        <CommentThread cms={cms} task={t.id} />
      </section>
      <section className="td-sec">
        <h3>Historia zadania</h3>
        {hist.length ? (
          <ul className="feed">
            {hist.map((a) => {
              const c = AL[a.action] ?? ["gray", a.action];
              return (
                <li key={a.id}>
                  <div className="fi">
                    <span className={"chip " + c[0]}>{c[1]}</span>
                    <b>{a.entity === "system" ? a.target : (EL[a.entity] || "") + " „" + a.target + "”"}</b>
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
      </section>
    </>
  );
}

function newLabelForm(t: Task) {
  openForm(
    "Nowa etykieta",
    [
      { id: "name", label: "Nazwa *", value: "", required: 1, full: 1 },
      { id: "color", label: "Kolor (#RRGGBB)", value: "#6366f1" },
    ],
    "Dodaj",
    (v) => {
      const name = v.name.trim();
      const color = v.color.trim().toLowerCase();
      if (!name) return bad("Podaj nazwę etykiety.");
      if (!/^#[0-9a-f]{6}$/.test(color)) return bad("Kolor musi mieć format #RRGGBB.");
      if (store.LABELS.some((l) => l.name.toLowerCase() === name.toLowerCase()))
        return bad("Etykieta o tej nazwie już istnieje w organizacji.");
      const l = { id: nextId("label"), org: store.orgId, name, color };
      update((s) => {
        s.LABELS.push(l);
        t.labels = [...(t.labels || []), l.id];
      });
      logAudit("create", "label", name);
      logAudit("update", "task", t.title, "Etykieta: + " + name);
      toast("Dodano etykietę „" + name + "” do zadania");
    },
  );
}

function Labels({ t }: { t: Task }) {
  const free = store.LABELS.filter((l) => !(t.labels || []).includes(l.id));
  const [pick, setPick] = useState("");
  const sel = free.some((l) => String(l.id) === pick) ? pick : String(free[0]?.id ?? "");
  const cur = lblOf(t);
  return (
    <div className="td-f wide2">
      <small>Etykiety</small>
      <div className="row2">
        {cur.length ? (
          cur.map((l) => (
            <span key={l.id} className="lbl" style={{ "--lc": l.color } as React.CSSProperties}>
              {l.name}
              <button
                type="button"
                aria-label={"Usuń etykietę " + l.name}
                onClick={() => {
                  update(() => {
                    t.labels = (t.labels || []).filter((x) => x !== l.id);
                  });
                  logAudit("update", "task", t.title, "Etykieta: − " + l.name);
                }}
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="muted">Brak etykiet.</span>
        )}
      </div>
      <div className="row2" style={{ marginTop: 6 }}>
        {free.length ? (
          <>
            <select className="td-in" aria-label="Etykieta do dodania" value={sel} onChange={(e) => setPick(e.target.value)}>
              {free.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="mini"
              onClick={() => {
                const l = free.find((x) => String(x.id) === sel);
                if (!l) return;
                update(() => {
                  t.labels = [...(t.labels || []), l.id];
                });
                logAudit("update", "task", t.title, "Etykieta: + " + l.name);
              }}
            >
              Dodaj
            </button>
          </>
        ) : null}
        <button type="button" className="mini" onClick={() => newLabelForm(t)}>
          + Nowa etykieta
        </button>
      </div>
      <div style={{ marginTop: 4 }}>
        <Prop why="label (organization_id, name, color) i task_label (task_id, label_id) – w modelu nie ma etykiet zadań (uwaga z przeglądu makiety)." />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  opts,
  onChange,
}: {
  label: string;
  value: string | number | null;
  opts: [string | number, string][];
  onChange: (v: string) => void;
}) {
  return (
    <label className="td-f">
      <small>{label}</small>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {opts.map(([v, l]) => (
          <option key={String(v)} value={String(v)}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

const NONE: [string, string] = ["", "— brak —"];
const optNum = (v: string) => (v === "" ? null : +v);

function Side({ t }: { t: Task }) {
  const [asUser, setAsUser] = useState("");
  const [hours, setHours] = useState("");
  const [day, setDay] = useState(fmt(base));
  const p = t.project ? store.PROJECTS.find((x) => x.id === t.project) : null;
  const ms = store.MILES.filter((m) => m.project === t.project);
  const tm = store.TIME.filter((e) => e.task === t.id);
  const hrs = tm.reduce((a, e) => a + e.hours, 0);
  const atts = store.ATT.filter((a) => a.task === t.id);
  const cand = memUsers().filter((u) => activeMem(u.id) && !t.assg.includes(u.id));
  const candSel = cand.some((u) => String(u.id) === asUser) ? asUser : String(cand[0]?.id ?? "");
  const pfs = p ? store.PF.filter((x) => x.project === p.id) : [];
  const me = store.ME;
  const meta = (u: number) => store.ASM[asKey(t.id, u)] as Asm | undefined;
  const ref = { tid: t.id, pid: t.project ?? undefined };

  const assign = () => {
    const u = +candSel;
    if (!activeMem(u)) {
      toast("Można przypisać tylko aktywnego członka organizacji.");
      return;
    }
    update((s) => {
      t.assg.push(u);
      s.ASM[asKey(t.id, u)] = { by: me, at: off(0), start: null, end: null };
    });
    logAudit("assigned", "task", t.title, "Przypisano: " + actorName(u));
  };
  const unassign = (u: number) => {
    if (store.TIME.some((e) => e.task === t.id && e.user === u)) {
      toast("Ta osoba ma zarejestrowany czas – przypisania nie można usunąć. Rozwiązaniem jest kolumna removed_at (propozycja schematu A3).");
      return;
    }
    update((s) => {
      t.assg = t.assg.filter((x) => x !== u);
      delete s.ASM[asKey(t.id, u)];
    });
    logAudit("unassigned", "task", t.title, "Odpięto: " + actorName(u));
  };
  const start = () => {
    update((s) => {
      const a = (s.ASM[asKey(t.id, me)] ??= { by: me, at: off(0), start: null, end: null });
      a.start = off(0);
    });
    logAudit("update", "task", t.title, "Rozpoczęto pracę");
  };
  const end = () => {
    const a = meta(me);
    if (!a || !a.start) {
      toast("Najpierw rozpocznij pracę.");
      return;
    }
    update(() => {
      a.end = off(0);
    });
    logAudit("update", "task", t.title, "Zakończono pracę");
  };
  const take = () => {
    if (!inPool(t)) {
      toast("Zadanie z puli może wziąć tylko członek grupy.");
      return;
    }
    update((s) => {
      t.assg.push(me);
      s.ASM[asKey(t.id, me)] = { by: me, pool: true, at: off(0), start: null, end: null } as Asm;
    });
    logAudit("assigned", "task", t.title, "Wzięto z puli grupy „" + gName(t.group) + "”");
    toast("Zadanie jest teraz Twoje");
  };
  const addTime = () => {
    const h = parseFloat(hours.replace(",", "."));
    if (!t.assg.includes(me)) {
      toast("Czas można zapisać tylko w swoim przypisaniu.");
      return;
    }
    if (!(h > 0 && h <= 24)) {
      toast("Podaj liczbę godzin od 0,25 do 24.");
      return;
    }
    if (!day) {
      toast("Wybierz dzień pracy.");
      return;
    }
    update((s) => {
      s.TIME.push({ id: nextId("time"), task: t.id, user: me, hours: h, date: day, note: "", created: off(0) });
    });
    logAudit("create", "time_entry", t.title, fmtH(h) + " · " + day, ref);
    toast("Zapisano " + fmtH(h));
    setHours("");
  };
  const upload = (f: File | undefined) => {
    if (!f) return;
    const why = attErr(f);
    if (why) {
      toast(why);
      return;
    }
    update((s) => {
      s.ATT.push({ id: nextId("attachment"), task: t.id, name: f.name, size: f.size, by: me, ts: new Date() });
    });
    logAudit("create", "attachment", f.name, "", ref);
    toast("Dodano załącznik");
  };

  return (
    <>
      <Field
        label="Status"
        value={t.sid}
        opts={visSt(t.project).map((s) => [s.id, s.name + " · " + CAT[s.cat].toLowerCase()])}
        onChange={(v) => changeStatus(t, +v)}
      />
      <Field
        label="Priorytet"
        value={t.prio}
        opts={[1, 2, 3, 4, 5].map((i) => [i, i + " · " + PR_PL[i]])}
        onChange={(v) => {
          update(() => {
            t.prio = +v;
          });
          logAudit("update", "task", t.title, "Priorytet → " + PR_PL[t.prio]);
        }}
      />
      <Labels t={t} />
      <div className="td-f wide2">
        <small>Przypisane osoby</small>
        {t.assg.length ? (
          t.assg.map((u) => {
            const a = meta(u) ?? ({} as Partial<Asm>);
            const mine = u === me;
            return (
              <div key={u} className="as">
                <Avatar id={u} />
                <div>
                  <b>{actorName(u)}</b>
                  <small>
                    {a.end ? "Zakończono " + a.end : a.start ? "Pracuje od " + a.start : "Praca nierozpoczęta"}
                    {a.pool ? " · wzięte z puli" : a.by && a.by !== u ? " · przypisał(a): " + actorName(a.by) : ""}
                  </small>
                </div>
                {mine && !a.start ? (
                  <button type="button" className="mini" onClick={start}>
                    Start
                  </button>
                ) : null}
                {mine && a.start && !a.end ? (
                  <button type="button" className="mini" onClick={end}>
                    Koniec
                  </button>
                ) : null}
                <button type="button" className="ab" aria-label={"Odepnij: " + actorName(u)} onClick={() => unassign(u)}>
                  ×
                </button>
              </div>
            );
          })
        ) : (
          <div className="muted">Nikt nie jest przypisany.</div>
        )}
        {inPool(t) ? (
          <button type="button" className="mini pri" style={{ marginTop: 6 }} onClick={take}>
            Weź zadanie z puli grupy
          </button>
        ) : null}
        {cand.length ? (
          <div className="row2" style={{ marginTop: 6 }}>
            <select className="td-in" aria-label="Osoba do przypisania" value={candSel} onChange={(e) => setAsUser(e.target.value)}>
              {cand.map((u) => (
                <option key={u.id} value={u.id}>
                  {uname(u)}
                </option>
              ))}
            </select>
            <button type="button" className="mini" onClick={assign}>
              Przypisz
            </button>
          </div>
        ) : null}
      </div>
      <Field
        label="Grupa (pula zadań)"
        value={t.group}
        opts={[NONE, ...store.GROUPS.map((g): [number, string] => [g.id, g.name])]}
        onChange={(v) => {
          update(() => {
            t.group = optNum(v);
          });
          logAudit("update", "task", t.title, t.group ? "Przekazano grupie „" + gName(t.group) + "”" : "Zdjęto z puli grupy");
          toast(t.group ? "Zadanie jest w puli grupy „" + gName(t.group) + "”" : "Zadanie zdjęte z puli");
        }}
      />
      {p ? (
        <Field
          label="Etap"
          value={t.ms}
          opts={[NONE, ...ms.map((m): [number, string] => [m.id, m.name])]}
          onChange={(v) => {
            update(() => {
              t.ms = optNum(v);
            });
            logAudit("update", "task", t.title, "Etap → " + (t.ms ? msName(t.ms) : "brak"));
          }}
        />
      ) : null}
      {p && pfs.length ? (
        <Field
          label="Rozliczane z finansowania"
          value={t.pf}
          opts={[["", "— bez finansowania —"], ...pfs.map((x): [number, string] => [x.id, fName(x.funding)])]}
          onChange={(v) => {
            update(() => {
              t.pf = optNum(v);
              t.funding = t.pf ? (store.PF.find((x) => x.id === t.pf)?.funding ?? null) : null;
            });
            logAudit("update", "task", t.title, "Finansowanie → " + (t.funding ? fName(t.funding) : "brak"));
          }}
        />
      ) : null}
      <div className="td-f">
        <small>Start → termin</small>
        <div>
          {t.start || "—"} → {t.due ? isOverdue(t) ? <span className="late">{t.due}</span> : t.due : "—"}
        </div>
      </div>
      <div className="td-f">
        <small>Szacunek / zarejestrowano</small>
        <div>
          {t.est != null ? fmtH(t.est) : "—"} / <b>{fmtH(hrs)}</b>
        </div>
      </div>
      <div className="td-f">
        <small>Projekt / finansowanie</small>
        <div>
          {p ? p.name : "—"}
          {t.funding ? " · " + fName(t.funding) : ""}
        </div>
      </div>
      <div className="td-f">
        <small>Autor</small>
        <div>
          {t.author ? actorName(t.author) : "—"}{" "}
          <Prop why="task.created_by – na diagramie zadanie nie ma autora, jest tylko w dzienniku zdarzeń (rejestr pkt 4, B2)." />
        </div>
      </div>
      <div className="td-f wide2">
        <small>
          Czas pracy · {tm.length} {plural(tm.length, "wpis", "wpisy", "wpisów")}
        </small>
        {tm
          .slice(-3)
          .reverse()
          .map((e) => (
            <div key={e.id} className="as">
              <Avatar id={e.user} />
              <div>
                <b>{fmtH(e.hours)}</b>
                <small>
                  {e.date} · {actorName(e.user)}
                  {e.note ? " · " + e.note : ""}
                </small>
              </div>
            </div>
          ))}
        {t.assg.includes(me) ? (
          <div className="row2" style={{ marginTop: 6 }}>
            <input className="td-in" type="number" min="0.25" max="24" step="0.25" placeholder="godz." aria-label="Liczba godzin" style={{ maxWidth: 84 }} value={hours} onChange={(e) => setHours(e.target.value)} />
            <input className="td-in" type="date" aria-label="Dzień pracy" value={day} onChange={(e) => setDay(e.target.value)} />
            <button type="button" className="mini" onClick={addTime}>
              Zapisz czas
            </button>
          </div>
        ) : (
          <div className="muted" style={{ fontSize: 12 }}>
            Czas rejestruje osoba przypisana do zadania.
          </div>
        )}
      </div>
      <div className="td-f wide2">
        <small>Załączniki</small>
        {atts.map((a) => (
          <div key={a.id} className="att">
            <Paperclip size={14} /> {a.name}
            <small>
              {fsize(a.size)} · {actorName(a.by)}
            </small>
          </div>
        ))}
        <input
          type="file"
          id="td-file"
          className="fileinp"
          accept={ATT_OK.map((x) => "." + x).join(",")}
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <label htmlFor="td-file" className="mini" style={{ display: "inline-block", cursor: "pointer" }}>
          + Dodaj plik
        </label>
      </div>
    </>
  );
}

// Port of mock.html vTD() (+ tdMain, tdSide), drawer layout only. Mounted once in AppShell; renders only while store.taskOpen is set.
export default function TaskPanel() {
  const { taskOpen } = useDemo();
  const t = taskOpen != null ? store.TASKS.find((x) => x.id === taskOpen) : undefined;
  const open = !!t;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (document.querySelector('[role="alertdialog"], [data-slot="dialog-content"]')) return;
      openTask(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (back && document.contains(back)) back.focus();
    };
  }, [open]);

  if (!t) return null;
  const par = t.parent ? store.TASKS.find((x) => x.id === t.parent) : null;
  const crumb = [t.project ? pName(t.project) : t.funding ? fName(t.funding) : "Bez projektu", par ? par.title : ""]
    .filter(Boolean)
    .join(" › ");

  return (
    <div className="mk">
      <div
        className="td-back"
        onClick={(e) => {
          if (e.target === e.currentTarget) openTask(null);
        }}
      >
        <div className="td-drawer" role="dialog" aria-modal="true" aria-labelledby="tdt">
          <div className="td-h">
            <div style={{ minWidth: 0 }}>
              <div className="td-crumb">
                {par ? (
                  <button type="button" className="tlink" onClick={() => openTask(par.id)}>
                    {crumb}
                  </button>
                ) : (
                  crumb
                )}{" "}
                · #{t.id}
              </div>
              <h2 id="tdt">{t.title}</h2>
              <div className="meta">
                <StatusChip task={t} />
                <PrioChip prio={t.prio} />
                {t.mand ? (
                  <>
                    <Chip c="red">Obowiązkowe</Chip>
                    <Prop why="task.is_mandatory – zadanie z szablonu finansowania jest zawsze obowiązkowe, ale po usunięciu szablonu (template_id → NULL) ta informacja znika (A2)." />
                  </>
                ) : null}
                {t.tpl ? <Chip c="gray">Z szablonu finansowania</Chip> : null}
                {isOverdue(t) ? <Chip c="red">Po terminie</Chip> : null}
              </div>
            </div>
            <div className="td-tools">
              <button type="button" className="mini" onClick={() => taskEditForm(t)}>
                Edytuj
              </button>
              <button type="button" className="mini dang" onClick={() => deleteTask(t)}>
                Usuń
              </button>
              <button ref={closeRef} type="button" className="m-x" aria-label="Zamknij szczegóły" onClick={() => openTask(null)}>
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="td-scroll">
            <div className="td-grid">
              <div className="td-main">
                <Main t={t} />
              </div>
              <aside className="td-side" aria-label="Atrybuty zadania">
                <Side t={t} />
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
