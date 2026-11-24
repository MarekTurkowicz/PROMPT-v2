import { Paperclip, Pencil } from "lucide-react";
import { useParams } from "react-router-dom";
import { EXT, MAX_ATT, base, fmt } from "@/demo/core";
import type { Expense, ProjectFunding } from "@/demo/data";
import { actorName, curOrg, fName, money, projectOf, spent } from "@/demo/helpers";
import { logAudit, nextId, store, update, useDemo } from "@/demo/store";
import { Chip, Prop, TaskLink, bad, openForm, toast } from "@/demo/ui";

const SCAN_OK = ["pdf", "png", "jpg", "jpeg"];

function expForm(e: Expense | null, pid: number) {
  const links = store.PF.filter((x) => x.project === pid);
  openForm(
    e ? "Edytuj wydatek" : "Nowy wydatek",
    [
      { id: "type", label: "Typ", type: "select", options: Object.entries(EXT), value: e ? e.type : "external_services" },
      { id: "amount", label: "Kwota (" + curOrg() + ") *", type: "number", value: e ? e.amount : "" },
      { id: "date", label: "Data *", type: "date", value: e ? e.date : fmt(base) },
      { id: "doc", label: "Numer dokumentu", value: e ? e.doc || "" : "" },
      {
        id: "src",
        label: "Źródło",
        type: "select",
        options: [...links.map((x): [number | string, string] => [x.id, "Finansowanie: " + fName(x.funding)]), ["", "Koszt własny projektu"]],
        value: e ? (e.pf ?? "") : (links[0]?.id ?? ""),
      },
      {
        id: "task",
        label: "Zadanie (opcjonalnie)",
        type: "select",
        options: [["", "— brak —"], ...store.TASKS.filter((t) => t.project === pid).map((t): [number | string, string] => [t.id, t.title])],
        value: e ? (e.task ?? "") : "",
      },
      { id: "desc", label: "Opis *", type: "textarea", value: e ? e.desc : "", required: 1 },
      {
        id: "scan",
        label: e && e.att.length ? "Nowy skan (zastąpi: " + e.att.map((a) => a.name).join(", ") + ")" : "Skan dokumentu (PDF, PNG, JPG)",
        type: "file",
        accept: ".pdf,.png,.jpg,.jpeg",
        full: 1,
      },
    ],
    e ? "Zapisz" : "Dodaj wydatek",
    (v, files) => {
      const amount = +v.amount;
      if (!(amount > 0)) return bad("Kwota wydatku musi być większa od zera.");
      if (!v.date) return bad("Podaj datę wydatku.");
      const scan = files.scan;
      if (scan && !SCAN_OK.includes(scan.name.split(".").pop()!.toLowerCase())) {
        return bad("Skan musi być plikiem PDF, PNG albo JPG.");
      }
      if (scan && scan.size > MAX_ATT) return bad("Skan może mieć najwyżej 50 MB.");
      const d = {
        pf: v.src === "" ? null : +v.src,
        task: v.task === "" ? null : +v.task,
        type: v.type,
        amount,
        date: v.date,
        doc: v.doc.trim(),
        desc: v.desc.trim(),
      };
      if (e) {
        const ch: string[] = [];
        if (e.amount !== d.amount) ch.push("kwota: " + money(e.amount, e.cur) + " → " + money(d.amount, e.cur));
        if (e.date !== d.date) ch.push("data: " + e.date + " → " + d.date);
        if (e.type !== d.type) ch.push("typ: " + EXT[e.type] + " → " + EXT[d.type]);
        if (e.pf !== d.pf) ch.push("źródło zmienione");
        if (scan) ch.push("nowy skan");
        update(() => {
          Object.assign(e, d);
          if (scan) e.att = [{ name: scan.name, size: scan.size }];
        });
        logAudit("update", "expense", d.desc, ch.join(" · ") || "Zmieniono opis lub dokument", { pid });
        toast("Zapisano wydatek");
        return;
      }
      update((s) => {
        s.EXPN.push({
          id: nextId("expense"),
          project: pid,
          ...d,
          cur: curOrg(),
          by: s.ME,
          att: scan ? [{ name: scan.name, size: scan.size }] : [],
        });
      });
      logAudit("create", "expense", d.desc, money(amount), { pid });
      toast("Dodano wydatek");
    },
  );
}

function FundingCard({ x }: { x: ProjectFunding }) {
  const f = store.FUNDINGS.find((y) => y.id === x.funding);
  if (!f) return null;
  const sp = spent(x);
  const b0 = x.alloc ?? f.amount;
  const rem = b0 - sp;
  const pc = b0 ? Math.min(100, Math.round((sp / b0) * 100)) : 0;
  return (
    <div className="card bud">
      <h3>
        {f.name} {x.primary ? <Chip c="green">Główne</Chip> : null}
      </h3>
      <div className="muted">{f.funder || ""}</div>
      <div className="prog" style={{ marginTop: 10 }}>
        <div className="prog-l">
          <span>Wykorzystanie</span>
          <b>{pc}%</b>
        </div>
        <div className="prog-t">
          <i style={{ width: pc + "%", background: pc > 90 ? "#ef4444" : pc > 70 ? "#f59e0b" : "#6366f1" }} />
        </div>
      </div>
      <div className="kv">
        <span>Kwota finansowania</span>
        <b>{money(f.amount, f.cur)}</b>
        <span>
          Alokacja na projekt <Prop why="project_funding.allocated_amount (A1)" />
        </span>
        <b>{x.alloc != null ? money(x.alloc, f.cur) : "—"}</b>
        <span>Wydatki</span>
        <b>{money(sp, f.cur)}</b>
        <span>Pozostało</span>
        <b className={rem < 0 ? "late" : ""}>{money(rem, f.cur)}</b>
      </div>
    </div>
  );
}

export default function BudgetTab() {
  const s = useDemo();
  const p = projectOf(useParams().projectId);
  if (!p) return null;
  const links = s.PF.filter((x) => x.project === p.id);
  const ex = s.EXPN.filter((e) => e.project === p.id).sort((a, b) => ((a.date ?? "") < (b.date ?? "") ? 1 : -1));
  const own = ex.filter((e) => !e.pf);
  const owns = own.reduce((a, e) => a + e.amount, 0);

  return (
    <div className="mk">
      <div className="lp-head" style={{ padding: 0 }}>
        <span className="muted">Raport budżetu: kwota finansowania minus suma wydatków.</span>
        <button type="button" className="btn-primary" onClick={() => expForm(null, p.id)}>
          Dodaj wydatek
        </button>
      </div>
      <div className="cards3">
        {links.map((x) => (
          <FundingCard key={x.id} x={x} />
        ))}
        <div className="card bud">
          <h3>Koszty własne projektu</h3>
          <div className="muted">Wydatki bez finansowania</div>
          <div className="kv">
            <span>Suma</span>
            <b>{money(owns)}</b>
            <span>Liczba wydatków</span>
            <b>{own.length}</b>
          </div>
        </div>
      </div>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Typ</th>
              <th>Opis</th>
              <th>Źródło</th>
              <th>Zadanie</th>
              <th>Dokument</th>
              <th>Skan</th>
              <th>Dodał(a)</th>
              <th className="ta-r">Kwota</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ex.length ? (
              ex.map((e) => {
                const tk = e.task ? s.TASKS.find((t) => t.id === e.task) : undefined;
                const src = e.pf ? fName(s.PF.find((x) => x.id === e.pf)?.funding) : "Koszt własny";
                return (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{EXT[e.type]}</td>
                    <td>{e.desc}</td>
                    <td>{src}</td>
                    <td>{tk ? <TaskLink id={tk.id}>{tk.title}</TaskLink> : "—"}</td>
                    <td>{e.doc || "—"}</td>
                    <td>
                      {e.att.length
                        ? e.att.map((a, i) => (
                            <span key={i}>
                              {i ? <br /> : null}
                              <Paperclip size={12} aria-hidden="true" style={{ display: "inline" }} /> {a.name}
                            </span>
                          ))
                        : "—"}
                    </td>
                    <td>{actorName(e.by)}</td>
                    <td className="ta-r">
                      <b>{money(e.amount, e.cur)}</b>
                    </td>
                    <td className="ta-r">
                      <button type="button" className="ab" aria-label={"Edytuj wydatek: " + e.desc} onClick={() => expForm(e, e.project)}>
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10}>
                  <div className="empty-s">Brak wydatków.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
