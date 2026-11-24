// Port of mock.html aUsers(), memCell, userForm.
import { Check, Lock, LockOpen, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MST, ROLE_L, cmp, off, type RoleCode } from "@/demo/core";
import type { User } from "@/demo/data";
import { activeMem, initials, memOf, memUsers, uname, user } from "@/demo/helpers";
import { logAudit, store, update, useDemo } from "@/demo/store";
import { EmptyState, Prop, bad, openConfirm, openForm, toast } from "@/demo/ui";
import { FilterBar, type FilterChip } from "./FilterBar";
import { addUser, delBlock, removeUser, userCnt } from "./members";

const IS_STAFF = true;
const ROLE_OPTS: [string, string][] = [
  ["all", "Wszystkie role"],
  ["admin", "Admin"],
  ["pm", "PM"],
  ["member", "Członek"],
  ["viewer", "Obserwator"],
];
type SortKey = "name" | "email" | "org" | "role" | "phone" | "tasks" | "done";

const activeAdmins = () => memUsers().filter((x) => x.role === "admin" && activeMem(x.id)).length;

function userForm(u?: User) {
  const m = u && memOf(u.id);
  openForm(
    u ? "Edytuj: " + u.email : "Zaproś członka",
    [
      { id: "email", label: "E-mail konta *", type: "email", value: u?.email || "", required: 1, full: 1 },
      { id: "first", label: "Imię", value: u?.first || "" },
      { id: "last", label: "Nazwisko", value: u?.last || "" },
      { id: "role", label: "Rola w organizacji", type: "select", options: Object.entries(ROLE_L), value: u?.role || "member" },
      { id: "job", label: "Stanowisko", value: m?.job || "" },
      { id: "phone", label: "Telefon służbowy", value: m?.phone || "" },
      { id: "memail", label: "E-mail służbowy", type: "email", value: m?.email || "" },
      { id: "avatar", label: "Zdjęcie (adres URL)", value: m?.avatar || "", full: 1 },
    ],
    u ? "Zapisz" : "Wyślij zaproszenie",
    (v) => {
      const d = { email: v.email.trim().toLowerCase(), first: v.first.trim(), last: v.last.trim() };
      const md = { job: v.job.trim(), phone: v.phone.trim(), email: v.memail.trim().toLowerCase(), avatar: v.avatar.trim() };
      const role = v.role as RoleCode;
      if (md.avatar && !/^https?:\/\//.test(md.avatar)) return bad("Adres zdjęcia musi zaczynać się od http:// albo https://.");
      if (u) {
        if (store.USERS.some((x) => x !== u && x.email.toLowerCase() === d.email)) return bad("Taki e-mail już istnieje.");
        if (u.id === store.ME && !["admin", "pm"].includes(role)) return bad("Nie możesz odebrać sobie uprawnień administracyjnych.");
        if (u.role === "admin" && role !== "admin" && activeAdmins() <= 1) return bad("Musi zostać co najmniej jeden aktywny administrator.");
        update(() => {
          Object.assign(u, d);
          u.role = role;
          if (m) Object.assign(m, md);
        });
        logAudit("update", "member", d.email);
        toast("Zapisano zmiany");
        return;
      }
      const x = store.USERS.find((y) => y.email.toLowerCase() === d.email);
      if (x && memOf(x.id)) {
        const st = memOf(x.id)!.status;
        return bad(
          "Ta osoba ma już członkostwo w tej organizacji (" + MST[st][1].toLowerCase() + ")." +
            (st === "left" ? " Użyj „Zaproś ponownie” na liście członków." : ""),
        );
      }
      update(() => addUser(d, role, md));
      logAudit("invited", "member", d.email, "Zaproszenie · rola: " + ROLE_L[role]);
      toast("Wysłano zaproszenie do " + d.email);
    },
  );
}

function MemCell({ u }: { u: User }) {
  const m = memOf(u.id)!;
  const c = MST[m.status];
  const setStatus = (status: "active" | "suspended" | "invited", detail: string, msg: string, extra?: () => void) => {
    update(() => {
      m.status = status;
      extra?.();
    });
    logAudit("update", "member", u.email, detail);
    toast(msg);
  };
  let act = null;
  if (m.status === "left")
    act = (
      <button
        type="button"
        className="mini"
        onClick={() => {
          update(() => {
            m.status = "invited";
            m.invited = off(0);
            m.joined = null;
          });
          logAudit("invited", "member", u.email, "Ponowne zaproszenie · członkostwo: odszedł → zaproszony");
          toast("Wysłano ponowne zaproszenie");
        }}
      >
        Zaproś ponownie
      </button>
    );
  else if (m.status === "invited")
    act = (
      <button
        type="button"
        className="mini"
        title="W aplikacji robi to zaproszona osoba"
        onClick={() => setStatus("active", "Członkostwo: zaproszony → aktywny", "Zaproszenie przyjęte", () => (m.joined = off(0)))}
      >
        Przyjmij (demo)
      </button>
    );
  else if (m.status === "active" && u.id !== store.ME)
    act = (
      <button
        type="button"
        className="mini"
        onClick={() => {
          if (u.role === "admin" && activeAdmins() <= 1) return toast("Nie można zawiesić ostatniego aktywnego administratora organizacji.");
          setStatus("suspended", "Członkostwo: aktywny → zawieszony", "Zawieszono członka – traci dostęp do danych organizacji");
        }}
      >
        Zawieś
      </button>
    );
  else if (m.status === "suspended")
    act = (
      <button type="button" className="mini" onClick={() => setStatus("active", "Członkostwo: zawieszony → aktywny", "Przywrócono członka")}>
        Przywróć
      </button>
    );
  return (
    <>
      <div className="row2">
        <span className={"chip " + c[0]}>{c[1]}</span>
        {u.active === false ? <span className="chip red">Konto zablokowane</span> : null}
        {act}
      </div>
      <div className="meta-t">
        {m.status === "invited" ? (
          <>
            zaproszono {m.invited || "—"}{" "}
            <Prop why="organization_member.invited_at – bez daty nie wiadomo, kiedy wysłano zaproszenie (rejestr pkt 10, A8)." />
          </>
        ) : m.joined ? (
          "członek od " + m.joined
        ) : (
          ""
        )}
        {m.job ? " · " + m.job : ""}
      </div>
    </>
  );
}

function toggleAccount(u: User) {
  if (u.id === store.ME) return toast("Nie możesz zablokować własnego konta.");
  const flip = () => {
    update(() => {
      u.active = u.active === false;
    });
    logAudit("update", "user", u.email, u.active ? "Konto odblokowane" : "Konto zablokowane (is_active = false)");
    toast(u.active ? "Odblokowano konto" : "Zablokowano konto – osoba nie zaloguje się do żadnej organizacji");
  };
  if (u.active === false) return flip();
  if (u.role === "admin" && activeMem(u.id) && activeAdmins() <= 1)
    return toast("To ostatni aktywny administrator tej organizacji – najpierw nadaj rolę komuś innemu.");
  openConfirm(`Zablokować konto ${u.email}? Osoba straci dostęp do wszystkich organizacji.`, flip, "Zablokuj");
}

export default function MembersSection() {
  const s = useDemo();
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("all");
  const [statF, setStatF] = useState("all");
  const [k, setK] = useState<SortKey>("name");
  const [d, setD] = useState(1);
  const [dense, setDense] = useState(false);
  const [selRaw, setSel] = useState<number[]>([]);
  const [confirm, setConfirm] = useState<number | null>(null);
  const [bulkRole, setBulkRole] = useState<RoleCode>("member");
  const allRef = useRef<HTMLInputElement>(null);

  const total = memUsers().length;
  const ql = q.trim().toLowerCase();
  const rows = memUsers()
    .filter(
      (u) =>
        (!ql || (uname(u) + " " + u.email).toLowerCase().includes(ql)) &&
        (roleF === "all" || u.role === roleF) &&
        (statF === "all" || memOf(u.id)!.status === statF),
    )
    .sort((a, b) => {
      const G: Record<SortKey, (u: User) => string | number> = {
        name: (u) => uname(u).toLowerCase(),
        email: (u) => u.email,
        org: (u) => MST[memOf(u.id)!.status][1],
        role: (u) => ROLE_L[u.role],
        phone: (u) => memOf(u.id)!.phone || "",
        tasks: (u) => userCnt(u).t,
        done: (u) => userCnt(u).d,
      };
      return cmp(G[k](a), G[k](b)) * d;
    });
  const sel = selRaw.filter((id) => user(id));
  const vis = rows.map((u) => u.id);
  const allSel = vis.length > 0 && vis.every((id) => sel.includes(id));
  const some = vis.some((id) => sel.includes(id));
  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = !allSel && some;
  });

  const chips: FilterChip[] = [];
  if (ql) chips.push({ label: "Szukaj: „" + q.trim() + "”", remove: () => setQ("") });
  if (roleF !== "all") chips.push({ label: "Rola: " + ROLE_L[roleF as RoleCode], remove: () => setRoleF("all") });
  if (statF !== "all") chips.push({ label: "Status: " + MST[statF][1], remove: () => setStatF("all") });
  const clearFilters = () => {
    setQ("");
    setRoleF("all");
    setStatF("all");
  };

  const sort = (key: SortKey) => {
    if (k === key) setD(-d);
    else {
      setK(key);
      setD(1);
    }
  };
  const Th = ({ id, label, cls = "" }: { id: SortKey; label: string; cls?: string }) => (
    <th className={cls} aria-sort={k === id ? (d > 0 ? "ascending" : "descending") : "none"}>
      <button type="button" className="thb" onClick={() => sort(id)}>
        {label}
        <span aria-hidden="true">{k === id ? (d > 0 ? "▲" : "▼") : ""}</span>
      </button>
    </th>
  );
  const toggle = (id: number) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  const toggleAll = () => setSel(allSel ? sel.filter((id) => !vis.includes(id)) : [...new Set([...sel, ...vis])]);

  const doBulkRole = () => {
    const ids = sel;
    if (!memUsers().some((u) => (ids.includes(u.id) ? bulkRole : u.role) === "admin")) return toast("Musi zostać co najmniej jeden administrator.");
    if (ids.includes(s.ME) && !["admin", "pm"].includes(bulkRole)) return toast("Nie możesz odebrać sobie uprawnień administracyjnych.");
    update(() =>
      ids.forEach((id) => {
        const u = user(id)!;
        if (u.role !== bulkRole) {
          logAudit("update", "user", u.email, "Rola: " + ROLE_L[u.role] + " → " + ROLE_L[bulkRole]);
          u.role = bulkRole;
        }
      }),
    );
    toast("Zmieniono rolę: " + ids.length + (ids.length === 1 ? " użytkownik" : " użytkowników"));
    setSel([]);
  };
  const doBulkDel = () => {
    const ids = sel;
    if (ids.includes(s.ME)) return toast("Nie możesz zakończyć własnego członkostwa.");
    if (!memUsers().some((u) => u.role === "admin" && !ids.includes(u.id))) return toast("Musi zostać co najmniej jeden administrator.");
    openConfirm(
      "Zakończyć członkostwo zaznaczonych osób (" + ids.length + ")? Ich zadania zostaną bez przypisania, historia zostaje.",
      () => {
        update(() => ids.forEach((id) => removeUser(user(id)!)));
        setSel([]);
        toast("Zakończono członkostwa: " + ids.length);
      },
    );
  };
  const askDel = (u: User) => {
    const why = delBlock(u);
    if (why) return toast(why);
    setConfirm(u.id);
  };
  const yesDel = (u: User) => {
    update(() => removeUser(u));
    setSel(sel.filter((x) => x !== u.id));
    setConfirm(null);
    toast("Zakończono członkostwo – historia osoby zostaje w dzienniku");
  };

  return (
    <div className="mk">
      <header className="ah">
        <div>
          <h1>
            Członkowie organizacji <span className="cnt">{total}</span>
          </h1>
          <p>
            Jedno konto może należeć do wielu organizacji. Zaproszenie tworzy członkostwo „zaproszony”, przyjęcie zmienia je na „aktywny”.
            Zawieszony członek traci dostęp do danych organizacji.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => userForm()}>
          + Zaproś członka
        </button>
      </header>
      <div className="ap-f">
        <input type="text" id="usearch" placeholder="Szukaj użytkownika…" aria-label="Szukaj użytkownika" value={q} onChange={(e) => setQ(e.target.value)} />
        <select id="urole" aria-label="Filtr roli" value={roleF} onChange={(e) => setRoleF(e.target.value)}>
          {ROLE_OPTS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select id="uorg" aria-label="Filtr statusu członkostwa" value={statF} onChange={(e) => setStatF(e.target.value)}>
          <option value="all">Wszystkie statusy</option>
          {Object.entries(MST).map(([v, l]) => (
            <option key={v} value={v}>
              {l[1]}
            </option>
          ))}
        </select>
        <div className="seg" role="group" aria-label="Gęstość tabeli">
          <button type="button" className={dense ? "" : "on"} aria-pressed={!dense} onClick={() => setDense(false)}>
            Komfortowa
          </button>
          <button type="button" className={dense ? "on" : ""} aria-pressed={dense} onClick={() => setDense(true)}>
            Kompaktowa
          </button>
        </div>
      </div>
      <FilterBar chips={chips} count={`${rows.length} z ${total}`} onClear={clearFilters} />
      {sel.length ? (
        <div className="bulk" role="region" aria-label="Akcje zbiorcze">
          <b>Zaznaczono: {sel.length}</b>
          <label className="sr" htmlFor="bulkrole">
            Nowa rola
          </label>
          <select id="bulkrole" value={bulkRole} onChange={(e) => setBulkRole(e.target.value as RoleCode)}>
            {Object.entries(ROLE_L).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <button type="button" className="btn" onClick={doBulkRole}>
            Zmień rolę
          </button>
          <button type="button" className="btn-danger" onClick={doBulkDel}>
            Zakończ członkostwo
          </button>
          <button type="button" className="lnk" onClick={() => setSel([])}>
            Wyczyść zaznaczenie
          </button>
        </div>
      ) : null}
      <div className={"tw" + (dense ? " dense" : "")}>
        <table>
          <thead>
            <tr>
              <th className="sel">
                <input ref={allRef} type="checkbox" id="usall" aria-label="Zaznacz wszystkich widocznych" checked={allSel} onChange={toggleAll} />
              </th>
              <Th id="name" label="Użytkownik" />
              <Th id="email" label="E-mail" />
              <Th id="org" label="Członkostwo" />
              <Th id="role" label="Rola" />
              <Th id="phone" label="Telefon" />
              <Th id="tasks" label="Zadania" cls="ta-c" />
              <Th id="done" label="Ukończone" cls="ta-c" />
              <th className="ta-r">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((u) => {
                const c = userCnt(u);
                const on = sel.includes(u.id);
                const m = memOf(u.id)!;
                return (
                  <tr key={u.id} className={on ? "sel" : ""}>
                    <td className="sel">
                      <input type="checkbox" id={"us" + u.id} aria-label={"Zaznacz " + u.email} checked={on} onChange={() => toggle(u.id)} />
                    </td>
                    <td>
                      <div className="uc">
                        <span className="av" aria-hidden="true">
                          {initials(u)}
                        </span>
                        {uname(u)}
                      </div>
                    </td>
                    <td>
                      {u.email}
                      {m.email ? <div className="meta-t">służbowy: {m.email}</div> : null}
                    </td>
                    <td>
                      <MemCell u={u} />
                    </td>
                    <td>
                      <span className={"role " + u.role}>{ROLE_L[u.role]}</span>
                    </td>
                    <td>{m.phone || "—"}</td>
                    <td className="ta-c">{c.t}</td>
                    <td className="ta-c">
                      <span className="done-b">{c.d}</span>
                    </td>
                    <td className="ta-r">
                      <button type="button" className="ab" title="Edytuj" aria-label={"Edytuj " + u.email} onClick={() => userForm(u)}>
                        <Pencil size={16} />
                      </button>
                      {IS_STAFF && u.id !== s.ME ? (
                        <button
                          type="button"
                          className="ab"
                          title={u.active === false ? "Odblokuj konto" : "Zablokuj konto (we wszystkich organizacjach)"}
                          aria-label={(u.active === false ? "Odblokuj konto " : "Zablokuj konto ") + u.email}
                          onClick={() => toggleAccount(u)}
                        >
                          {u.active === false ? <LockOpen size={16} /> : <Lock size={16} />}
                        </button>
                      ) : null}
                      {confirm === u.id ? (
                        <>
                          <button type="button" className="ab" style={{ color: "#16a34a" }} aria-label={"Potwierdź zakończenie członkostwa " + u.email} onClick={() => yesDel(u)}>
                            <Check size={16} />
                          </button>
                          <button type="button" className="ab" style={{ color: "#dc2626" }} aria-label="Anuluj" onClick={() => setConfirm(null)}>
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <button type="button" className="ab" title="Zakończ członkostwo" aria-label={"Zakończ członkostwo: " + u.email} onClick={() => askDel(u)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9}>
                  <EmptyState
                    title={chips.length ? "Brak użytkowników spełniających kryteria" : "Brak użytkowników"}
                    text="Zmień kryteria wyszukiwania albo wyczyść filtry."
                  >
                    {chips.length ? (
                      <button type="button" className="btn" onClick={clearFilters}>
                        Wyczyść filtry
                      </button>
                    ) : (
                      <button type="button" className="btn-primary" onClick={() => userForm()}>
                        + Dodaj użytkownika
                      </button>
                    )}
                  </EmptyState>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
