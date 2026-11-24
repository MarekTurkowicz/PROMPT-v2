// Port of mock.html aGroups() and the g-* actions.
import { off } from "@/demo/core";
import type { Group } from "@/demo/data";
import { actorName, activeMem, gName, memUsers, pName, roleId, uname } from "@/demo/helpers";
import { logAudit, nextId, store, update, useDemo } from "@/demo/store";
import { Avatar, EmptyState, bad, openConfirm, openForm, toast } from "@/demo/ui";

function addGroup(parent: number | null) {
  openForm(
    parent ? "Nowa podgrupa: " + gName(parent) : "Nowa grupa",
    [
      { id: "name", label: "Nazwa *", value: "", required: 1, full: 1 },
      { id: "desc", label: "Opis", type: "textarea", value: "" },
    ],
    "Utwórz",
    (v) => {
      const name = v.name.trim();
      if (store.GROUPS.some((g) => g.name.toLowerCase() === name.toLowerCase())) return bad("Grupa o tej nazwie już istnieje w organizacji.");
      update((s) => s.GROUPS.push({ id: nextId("group"), org: s.orgId, parent, name, desc: v.desc.trim(), members: [], created: off(0) }));
      logAudit("create", "group", name, parent ? "Podgrupa „" + gName(parent) + "”" : "");
      toast("Utworzono grupę");
    },
  );
}

function addMember(g: Group) {
  const c = memUsers().filter((u) => activeMem(u.id) && !g.members.includes(u.id));
  if (!c.length) return toast("Wszyscy aktywni członkowie są już w tej grupie.");
  openForm(
    "Dodaj osobę do grupy „" + g.name + "”",
    [{ id: "u", label: "Członek organizacji", type: "select", options: c.map((u) => [u.id, uname(u)]), value: c[0].id, full: 1 }],
    "Dodaj",
    (v) => {
      update(() => g.members.push(+v.u));
      logAudit("added_to_group", "group", g.name, "Dodano: " + actorName(+v.u));
      toast("Dodano do grupy");
    },
  );
}

function editGroup(g: Group) {
  const sub = new Set([g.id]);
  let grow = true;
  while (grow) {
    grow = false;
    store.GROUPS.forEach((x) => {
      if (x.parent != null && sub.has(x.parent) && !sub.has(x.id)) {
        sub.add(x.id);
        grow = true;
      }
    });
  }
  openForm(
    "Edytuj grupę „" + g.name + "”",
    [
      { id: "name", label: "Nazwa *", value: g.name, required: 1, full: 1 },
      { id: "desc", label: "Opis", type: "textarea", value: g.desc || "" },
      {
        id: "parent",
        label: "Grupa nadrzędna",
        type: "select",
        options: [["", "— brak (grupa główna) —"], ...store.GROUPS.filter((x) => !sub.has(x.id)).map((x): [number, string] => [x.id, x.name])],
        value: g.parent ?? "",
        full: 1,
      },
    ],
    "Zapisz",
    (v) => {
      const name = v.name.trim();
      const parent = v.parent === "" ? null : +v.parent;
      if (store.GROUPS.some((x) => x !== g && x.name.toLowerCase() === name.toLowerCase())) return bad("Grupa o tej nazwie już istnieje w organizacji.");
      if (parent != null && sub.has(parent)) return bad("Grupa nie może być podgrupą samej siebie ani swojej podgrupy.");
      const moved = parent !== g.parent;
      update(() => Object.assign(g, { name, desc: v.desc.trim(), parent }));
      logAudit(moved ? "moved" : "update", "group", name, moved ? "Grupa nadrzędna → " + (parent ? gName(parent) : "brak") : "");
      toast("Zapisano grupę");
    },
  );
}

function delGroup(g: Group) {
  if (store.GROUPS.some((x) => x.parent === g.id)) return toast("Najpierw usuń albo przenieś podgrupy.");
  const n = store.TASKS.filter((t) => t.group === g.id).length;
  openConfirm(
    `Usunąć grupę „${g.name}”?${n ? " Zadania w jej puli (" + n + ") zostaną bez grupy." : ""} Role nadane grupie zostaną odebrane.`,
    () => {
      update((s) => {
        s.GROUPS.splice(s.GROUPS.indexOf(g), 1);
        s.TASKS.forEach((t) => {
          if (t.group === g.id) t.group = null;
        });
        for (let i = s.ASSIGN.length - 1; i >= 0; i--) if (s.ASSIGN[i].group === g.id) s.ASSIGN.splice(i, 1);
      });
      logAudit("delete", "group", g.name);
      toast("Usunięto grupę");
    },
  );
}

function removeMember(g: Group, u: number) {
  update(() => {
    g.members = g.members.filter((x) => x !== u);
  });
  logAudit("removed_from_group", "group", g.name, "Usunięto: " + actorName(u));
}

function Node({ g }: { g: Group }) {
  const kids = store.GROUPS.filter((x) => x.parent === g.id);
  const rs = store.ASSIGN.filter((a) => a.group === g.id);
  return (
    <li>
      <div className="gnode">
        <div className="gnode-h">
          <div>
            <b>{g.name}</b> <span className="cnt">{g.members.length}</span>
            {g.desc ? <div className="muted">{g.desc}</div> : null}
            {rs.length ? (
              <div className="meta">
                {rs.map((a) => (
                  <span key={a.id} className="chip amber">
                    Rola: {roleId(a.role)?.name}
                    {a.project ? " · " + pName(a.project) : ""}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="row2">
            <button type="button" className="mini" onClick={() => addMember(g)}>
              + Osoba
            </button>
            <button type="button" className="mini" onClick={() => addGroup(g.id)}>
              + Podgrupa
            </button>
            <button type="button" className="mini" onClick={() => editGroup(g)}>
              Edytuj
            </button>
            <button type="button" className="mini dang" onClick={() => delGroup(g)}>
              Usuń
            </button>
          </div>
        </div>
        <div className="ppl2">
          {g.members.length ? (
            g.members.map((u) => (
              <span key={u} className="pchip">
                <Avatar id={u} small />
                {actorName(u)}
                <button type="button" aria-label={"Usuń " + actorName(u) + " z grupy"} onClick={() => removeMember(g, u)}>
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="muted">Brak osób.</span>
          )}
        </div>
      </div>
      {kids.length ? (
        <ul className="gtree">
          {kids.map((k) => (
            <Node key={k.id} g={k} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function GroupsSection() {
  const s = useDemo();
  const roots = s.GROUPS.filter((g) => !g.parent);
  return (
    <div className="mk">
      <header className="ah">
        <div>
          <h1>
            Grupy <span className="cnt">{s.GROUPS.length}</span>
          </h1>
          <p>
            Grupy mają hierarchię: rola nadana grupie działa też w jej podgrupach. Zadanie przekazane grupie trafia do jej puli, z której
            członkowie biorą zadania.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => addGroup(null)}>
          + Nowa grupa
        </button>
      </header>
      {roots.length ? (
        <ul className="gtree">
          {roots.map((g) => (
            <Node key={g.id} g={g} />
          ))}
        </ul>
      ) : (
        <EmptyState title="Brak grup" text="Utwórz pierwszą grupę, np. zespół projektowy." />
      )}
    </div>
  );
}
