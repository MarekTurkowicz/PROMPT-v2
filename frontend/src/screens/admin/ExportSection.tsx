// Port of mock.html aExport(); here the result is also downloaded as a file via Blob.
import { useState } from "react";
import { logAudit, useDemo } from "@/demo/store";
import { toast } from "@/demo/ui";
import { EXP, buildExport, type ExportKind } from "./csv";

type Out = ReturnType<typeof buildExport>;

export default function ExportSection() {
  useDemo();
  const [sets, setSets] = useState<Record<ExportKind, boolean>>({ users: true, projects: true, tasks: true, fundings: false, audit: false });
  const [fmt, setFmt] = useState<"csv" | "json">("csv");
  const [out, setOut] = useState<Out | null>(null);
  const any = Object.values(sets).some(Boolean);

  const run = () => {
    const o = buildExport(sets, fmt);
    setOut(o);
    logAudit("export", "system", "Eksport: " + o.keys.map((k) => EXP[k].label).join(", ") + " (" + fmt.toUpperCase() + ")", o.count + " rekordów");
    const blob = new Blob([o.text], { type: fmt === "json" ? "application/json" : "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "promt-eksport." + fmt;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const copy = () => {
    if (!out) return;
    const fallback = () => {
      document.querySelector<HTMLTextAreaElement>("#expout")?.select();
      toast("Zaznaczone. Skopiuj skrótem Ctrl+C.");
    };
    if (navigator.clipboard) navigator.clipboard.writeText(out.text).then(() => toast("Skopiowano do schowka"), fallback);
    else fallback();
  };

  return (
    <div className="mk">
      <header className="ah">
        <div>
          <h1>Eksport danych</h1>
          <p>Wybierz zestawy danych i format. Wynik pobiera się jako plik i pojawia się niżej do skopiowania.</p>
        </div>
      </header>
      <section className="card">
        <h2 className="sh">Zestawy danych</h2>
        <div className="sws" style={{ gap: 18, marginBottom: 14 }}>
          {(Object.entries(EXP) as [ExportKind, (typeof EXP)[ExportKind]][]).map(([k, v]) => (
            <label key={k} className="chk">
              <input type="checkbox" id={"exp-" + k} checked={sets[k]} onChange={(e) => setSets({ ...sets, [k]: e.target.checked })} />
              {v.label} <span className="muted">({v.rows().length})</span>
            </label>
          ))}
        </div>
        <div className="ap-f" style={{ marginBottom: 0 }}>
          <label className="lab" htmlFor="expfmt" style={{ margin: 0 }}>
            Format
          </label>
          <select id="expfmt" value={fmt} onChange={(e) => setFmt(e.target.value as "csv" | "json")}>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
          <button type="button" className="btn-primary" disabled={!any} onClick={run}>
            Generuj eksport
          </button>
        </div>
      </section>
      {out ? (
        <section className="card" style={{ marginTop: 14 }}>
          <div className="dc-h">
            <h2 className="sh" style={{ margin: 0 }}>
              Wynik
            </h2>
            <div className="lp-act">
              <span className="chip gray">{out.count} rekordów</span>
              <span className="chip gray">{(out.bytes / 1024).toFixed(1)} KB</span>
              <button type="button" className="btn" style={{ borderColor: "#e2e8f0" }} onClick={copy}>
                Kopiuj do schowka
              </button>
            </div>
          </div>
          <label className="sr" htmlFor="expout">
            Wynik eksportu
          </label>
          <textarea id="expout" className="form-input ta" rows={12} readOnly spellCheck={false} value={out.text} />
        </section>
      ) : null}
    </div>
  );
}
