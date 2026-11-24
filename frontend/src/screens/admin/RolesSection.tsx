// Port of mock.html aRoles() and the role-/grant-/perm actions.
import { Trash2, User as UserIcon, Users } from "lucide-react";
import { useState } from "react";
import { MST, PERMS, off } from "@/demo/core";
import type { Role } from "@/demo/data";
import { actorName, activeMem, assignRows, effRoles, gName, memOf, memUsers, pName, roleId, uname } from "@/demo/helpers";
import { logAudit, nextId, store, update, useDemo } from "@/demo/store";
import { Prop, bad, openConfirm, openForm, toast } from "@/demo/ui";

function addRole() {
  openForm(
    "Nowa rola",
    [
      { id: "name", label: "Nazwa *", value: "", required: 1, full: 1 },
      { id: "copy", label: "Skopiuj uprawnienia z", type: "select", options: [["", "— żadnej —"], ...store.ROLES.map((r): [number, string] => [r.id, r.name])], value: "" },
    ],
    "Utwórz",
    (v) => {
      const name = v.name.trim();
      if (store.ROLES.some((r) => r.name.toLowerCase() === name.toLowerCase())) return bad("Rola o tej nazwie już istnieje.");
      update((s) =>
        s.ROLES.push({ id: nextId("role"), org: s.orgId, code: null, name, perms: v.copy ? [...roleId(+v.copy)!.perms] : [] }),
      );
      logAudit("create", "role", name);
      toast("Utworzono rolę");
    },
  );
}

function delRole(r: Role) {
  if (r.code) return toast("Ról wbudowanych nie można usuwać.");
  const n = store.ASSIGN.filter((a) => a.role === r.id).length;
  openConfirm(`Usunąć rolę „${r.name}”?${n ? " Nadania tej roli (" + n + ") zostaną odebrane." : ""}`, () => {
    update((s) => {
      s.ROLES.splice(s.ROLES.indexOf(r), 1);
      for (let i = s.ASSIGN.length - 1; i >= 0; i--) if (s.ASSIGN[i].role === r.id) s.ASSIGN.splice(i, 1);
    });
    logAudit("delete", "role", r.name);
    toast("Usunięto rolę");
  });
}

function togglePerm(r: Role, c: string) {
  update(() => {
    r.perms = r.perms.includes(c) ? r.perms.filter((x) => x !== c) : [...r.perms, c];
  });
  logAudit("update", "role", r.name, (r.perms.includes(c) ? "Dodano " : "Odebrano ") + c);
}

function grantRole() {
  const mems = memUsers().filter((u) => activeMem(u.id));
  openForm(
    "Nadaj rolę",
    [
      { id: "role", label: "Rola", type: "select", options: store.ROLES.map((r): [number, string] => [r.id, r.name]), value: store.ROLES[0].id, full: 1 },
      {
        id: "who",
        label: "Komu",
        type: "select",
        options: [...mems.map((u): [string, string] => ["u" + u.id, "Osoba: " + uname(u)]), ...store.GROUPS.map((g): [string, string] => ["g" + g.id, "Grupa: " + g.name])],
        value: "u" + store.ME,
        full: 1,
      },
      { id: "pr", label: "Zakres", type: "select", options: [["", "Cała organizacja"], ...store.PROJECTS.map((p): [number, string] => [p.id, "Projekt: " + p.name])], value: "", full: 1 },
    ],
    "Nadaj",
    (v) => {
      const member = v.who[0] === "u" ? +v.who.slice(1) : null;
      const group = v.who[0] === "g" ? +v.who.slice(1) : null;
      const project = v.pr === "" ? null : +v.pr;
      const role = +v.role;
      if (assignRows().some((a) => a.role === role && a.member === member && a.group === group && a.project === project)) return bad("Takie nadanie już istnieje.");
      update((s) => s.ASSIGN.push({ id: nextId("assign"), org: s.orgId, role, member, group, project, created: off(0) }));
      logAudit(
        "granted",
        "role",
        roleId(role)!.name,
        (member ? actorName(member) : "grupa „" + gName(group) + "”") + (project ? " · projekt „" + pName(project) + "”" : " · organizacja"),
      );
      toast("Nadano rolę");
    },
  );
}

function revoke(id: number | string) {
  const a = store.ASSIGN.find((x) => x.id === id);
  if (!a) return;
  update((s) => s.ASSIGN.splice(s.ASSIGN.indexOf(a), 1));
  logAudit("revoked", "role", roleId(a.role)!.name, "Odebrano: " + (a.member ? actorName(a.member) : "grupa „" + gName(a.group) + "”"));
  toast("Odebrano rolę");
}

export default function RolesSection() {
  const s = useDemo();
  const [whoRaw, setWho] = useState(s.ME);
  const [proj, setProj] = useState("");
  const mems = memUsers().filter((u) => memOf(u.id)!.status !== "left");
  const who = mems.some((u) => u.id === whoRaw) ? whoRaw : s.ME;
  const pid = proj === "" ? null : +proj;
  const eff = effRoles(who, pid);
  const perms = new Set(eff.flatMap((x) => x.r.perms));
  const ms = memOf(who);
  const rows = assignRows();
  return (
    <div className="mk">
      <header className="ah">
        <div>
          <h1>Role i uprawnienia</h1>
          <p>Rola to zestaw kodów uprawnień. Nadajesz ją osobie albo grupie, w całej organizacji albo w jednym projekcie.</p>
        </div>
        <div className="row2">
          <button type="button" className="btn" style={{ borderColor: "#e2e8f0" }} onClick={addRole}>
            + Nowa rola
          </button>
          <button type="button" className="btn-primary" onClick={grantRole}>
            + Nadaj rolę
          </button>
        </div>
      </header>
      <section className="card" style={{ marginBottom: 14 }}>
        <h2 className="sh">
          Macierz uprawnień <Prop why="role.code – stały kod roli wbudowanej; po nazwie nie da się rozpoznać roli administratora, gdy ktoś ją przemianuje (A7)." />
        </h2>
        <div className="tw pm">
          <table>
            <thead>
              <tr>
                <th>Uprawnienie</th>
                {s.ROLES.map((r) => (
                  <th key={r.id}>
                    {r.name}
                    <div style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>
                      {r.code ? (
                        <code>{r.code}</code>
                      ) : (
                        <>
                          <span className="muted">rola własna</span>{" "}
                          <button type="button" className="ab" aria-label={"Usuń rolę " + r.name} onClick={() => delRole(r)}>
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMS.map(([c, l]) => (
                <tr key={c}>
                  <td>
                    <b>{l}</b>
                    <div className="muted">
                      <code>{c}</code>
                    </div>
                  </td>
                  {s.ROLES.map((r) => (
                    <td key={r.id}>
                      <input
                        type="checkbox"
                        aria-label={r.name + ": " + l}
                        checked={r.perms.includes(c)}
                        disabled={r.code === "admin"}
                        onChange={() => togglePerm(r, c)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ margin: "8px 0 0" }}>
          Administrator organizacji jest rolą wbudowaną i ma wszystkie uprawnienia.
        </p>
      </section>
      <div className="two">
        <section className="card">
          <h2 className="sh">
            Nadania ról <span className="cnt">{rows.length}</span>
          </h2>
          <div className="tw">
            <table style={{ minWidth: 0 }}>
              <thead>
                <tr>
                  <th>Rola</th>
                  <th>Komu</th>
                  <th>Zakres</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td>{roleId(a.role)?.name || "—"}</td>
                    <td>
                      <span className="ico-i">{a.member ? <UserIcon size={16} /> : <Users size={16} />}</span>
                      {a.member ? actorName(a.member) : gName(a.group)}
                    </td>
                    <td>{a.project ? "projekt „" + pName(a.project) + "”" : "organizacja"}</td>
                    <td className="ta-r">
                      {a.derived ? (
                        <span className="muted" title="Zmienisz na liście członków">
                          z listy członków
                        </span>
                      ) : (
                        <button type="button" className="ab" aria-label="Odbierz rolę" onClick={() => revoke(a.id)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card">
          <h2 className="sh">Sprawdź uprawnienia osoby</h2>
          <div className="of">
            <div className="fld">
              <label htmlFor="rwho">Osoba</label>
              <select id="rwho" value={who} onChange={(e) => setWho(+e.target.value)}>
                {mems.map((u) => (
                  <option key={u.id} value={u.id}>
                    {uname(u)}
                  </option>
                ))}
              </select>
            </div>
            <div className="fld">
              <label htmlFor="rproj">Kontekst</label>
              <select id="rproj" value={proj} onChange={(e) => setProj(e.target.value)}>
                <option value="">Cała organizacja</option>
                {s.PROJECTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    Projekt: {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {ms && ms.status !== "active" ? (
            <div className="card err">Członkostwo ma status „{MST[ms.status][1]}” – brak dostępu do danych organizacji.</div>
          ) : eff.length ? (
            eff.map((x, i) => (
              <div key={i} className="eff">
                <b>{x.r.name}</b>{" "}
                <span className="muted">
                  · {x.from} · {x.scope}
                </span>
              </div>
            ))
          ) : (
            <div className="empty-s">Brak ról.</div>
          )}
          <div className="lab" style={{ marginTop: 12 }}>
            Efektywne uprawnienia: {perms.size} z {PERMS.length}
          </div>
          <div className="rl">
            {PERMS.map(([c, l]) => (
              <div key={c}>
                {perms.has(c) ? (
                  <span className="ok-y" aria-label="tak">
                    ✓
                  </span>
                ) : (
                  <span className="ok-n" aria-label="nie">
                    ✗
                  </span>
                )}{" "}
                {l}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
