// Port of mock.html aSettings() and the orgForm submit handler.
import { useState } from "react";
import { logAudit, refreshPriorities, store, update, useDemo } from "@/demo/store";
import { toast } from "@/demo/ui";
import { OrgBlockCard } from "../shell/OrgBlockCard";

const TZS = ["Europe/Warsaw", "Europe/London", "Europe/Berlin", "UTC", "America/New_York"];
const CURS = ["PLN", "EUR", "USD", "GBP"];

export default function SettingsSection() {
  const s = useDemo();
  const o = s.ORGS.find((x) => x.id === s.orgId)!;
  const st = s.ORGSET[s.orgId];
  // Remount the form when the stored values change (org switch / save) so defaults follow the store.
  const formKey = [s.orgId, o.name, st.nip, st.tz, st.cur, st.prio.join("|")].join("~");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name")).trim();
    const nip = String(f.get("nip")).replace(/\D/g, "");
    const pr = [0, 1, 2, 3, 4].map((i) => String(f.get("p" + i)).trim());
    if (!name) return setErr("Nazwa organizacji jest wymagana.");
    if (nip && nip.length !== 10) return setErr("NIP musi mieć 10 cyfr.");
    if (nip && Object.entries(store.ORGSET).some(([id, x]) => +id !== store.orgId && x.nip === nip))
      return setErr("Ten NIP ma już inna organizacja.");
    if (pr.some((x) => !x)) return setErr("Każdy poziom priorytetu musi mieć nazwę.");
    setErr("");
    update(() => {
      o.name = name;
      Object.assign(st, { nip, tz: String(f.get("tz")), cur: String(f.get("cur")), prio: pr });
    });
    refreshPriorities();
    logAudit("update", "org", name, "Ustawienia organizacji");
    toast("Zapisano ustawienia organizacji");
  };

  return (
    <div className="mk">
      <header className="ah">
        <div>
          <h1>Ustawienia organizacji</h1>
          <p>
            Zapisywane w polu <code>organization.settings</code> (jsonb) i sprawdzane schematem przed zapisem.
          </p>
        </div>
      </header>
      <form key={formKey} className="card" onSubmit={submit}>
        {err ? (
          <p className="m-err" role="alert">
            {err}
          </p>
        ) : null}
        <div className="of">
          <div className="fld">
            <label htmlFor="o-name">Nazwa *</label>
            <input id="o-name" name="name" defaultValue={o.name} required />
          </div>
          <div className="fld">
            <label htmlFor="o-nip">NIP (unikalny, opcjonalny)</label>
            <input id="o-nip" name="nip" defaultValue={st.nip} placeholder="10 cyfr" inputMode="numeric" />
          </div>
          <div className="fld">
            <label htmlFor="o-tz">Strefa czasowa *</label>
            <select id="o-tz" name="tz" defaultValue={st.tz}>
              {TZS.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </div>
          <div className="fld">
            <label htmlFor="o-cur">Waluta *</label>
            <select id="o-cur" name="cur" defaultValue={st.cur}>
              {CURS.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </div>
        </div>
        <h2 className="sh" style={{ marginTop: 6 }}>
          Nazwy 5 poziomów priorytetu
        </h2>
        <div className="of">
          {st.prio.map((n, i) => (
            <div key={i} className="fld">
              <label htmlFor={"o-p" + i}>
                Priorytet {i + 1}
                {i === 0 ? " (najniższy)" : i === 4 ? " (najwyższy)" : ""} *
              </label>
              <input id={"o-p" + i} name={"p" + i} defaultValue={n} required />
            </div>
          ))}
        </div>
        <div className="m-foot">
          <button type="submit" className="btn-primary">
            Zapisz ustawienia
          </button>
        </div>
      </form>
      <OrgBlockCard />
    </div>
  );
}
