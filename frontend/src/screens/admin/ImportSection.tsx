// Port of mock.html aImport().
import { useMemo, useState } from "react";
import { logAudit, update } from "@/demo/store";
import { toast } from "@/demo/ui";
import { IMP, importResult, type ImportKind } from "./csv";

export default function ImportSection() {
  const [type, setType] = useState<ImportKind>("users");
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const sch = IMP[type];
  const res = useMemo(() => importResult(type, text), [type, text]);

  const readFile = (f: File | undefined) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      setText(String(r.result));
      setName(f.name);
    };
    r.readAsText(f);
  };
  const clear = () => {
    setText("");
    setName("");
  };
  const copy = () => {
    const t = sch.cols.join(",");
    if (!navigator.clipboard) return toast("Nagłówek CSV: " + t);
    navigator.clipboard.writeText(t).then(
      () => toast("Skopiowano nagłówek CSV"),
      () => toast("Nie udało się skopiować. Nagłówek: " + t),
    );
  };
  const run = () => {
    if (!res || !res.ok.length) return;
    update(() => res.ok.forEach(sch.add));
    logAudit("import", "system", "Import: " + sch.label, res.ok.length + " zaimportowanych, " + res.bad.length + " z błędami");
    toast("Zaimportowano: " + res.ok.length + (res.bad.length ? " (pominięto " + res.bad.length + ")" : ""));
    clear();
  };

  return (
    <div className="mk">
      <header className="ah">
        <div>
          <h1>Import danych</h1>
          <p>Wgraj plik CSV, sprawdź podgląd i zaimportuj poprawne wiersze. Dane zapisują się dopiero po kliknięciu „Importuj”.</p>
        </div>
      </header>
      <div className="two">
        <section className="card">
          <h2 className="sh">1. Rodzaj danych</h2>
          <label className="sr" htmlFor="imptype">
            Rodzaj danych
          </label>
          <select className="form-input" id="imptype" value={type} onChange={(e) => setType(e.target.value as ImportKind)}>
            {Object.entries(IMP).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <p className="muted">
            Kolumny:{" "}
            {sch.cols.map((c) => (
              <span key={c}>
                <code>{c}</code>{" "}
              </span>
            ))}
            . Wymagane:{" "}
            {sch.req.map((c, i) => (
              <span key={c}>
                {i ? ", " : ""}
                <b>{c}</b>
              </span>
            ))}
            . Separator: przecinek lub średnik.
          </p>
          <button type="button" className="btn" style={{ borderColor: "#e2e8f0" }} onClick={copy}>
            Kopiuj nagłówek CSV
          </button>
        </section>
        <section className="card">
          <h2 className="sh">2. Plik</h2>
          <label className="drop" htmlFor="impfile">
            <input
              type="file"
              className="fileinp"
              id="impfile"
              accept=".csv,text/csv,text/plain"
              onChange={(e) => {
                readFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <b>Przeciągnij plik CSV tutaj</b>
            <span>albo kliknij i wybierz z dysku</span>
          </label>
          {name ? (
            <div className="muted" style={{ marginTop: 6 }}>
              Wczytano: {name}
            </div>
          ) : null}
          <label htmlFor="imptext" className="lab" style={{ margin: "12px 0 6px", display: "block" }}>
            Albo wklej zawartość CSV
          </label>
          <textarea id="imptext" className="form-input ta" rows={4} spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} />
        </section>
      </div>
      {res ? (
        <section className="card">
          <h2 className="sh">3. Podgląd i kontrola</h2>
          {res.missing.length ? (
            <div className="warn">
              Brakuje wymaganych kolumn:{" "}
              {res.missing.map((c, i) => (
                <span key={c}>
                  {i ? ", " : ""}
                  <code>{c}</code>
                </span>
              ))}
              . Popraw nagłówek w pliku.
            </div>
          ) : (
            <>
              <div className="imp-sum">
                <span className="chip gray">{res.rows.length} wierszy</span>
                <span className="chip green">{res.ok.length} poprawnych</span>
                {res.bad.length ? <span className="chip red">{res.bad.length} z błędami</span> : null}
                {res.unknown.length ? <span className="muted">Pominięte kolumny: {res.unknown.join(", ")}</span> : null}
              </div>
              <div className="tw">
                <table className="dt">
                  <thead>
                    <tr>
                      {res.head.map((h, i) => (
                        <th key={i}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {res.rows.slice(0, 5).map((r, i) => (
                      <tr key={i}>
                        {res.head.map((_, j) => (
                          <td key={j}>{r[j] || ""}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {res.rows.length > 5 ? (
                <div className="muted" style={{ marginTop: 6 }}>
                  Pokazano 5 z {res.rows.length} wierszy.
                </div>
              ) : null}
              {res.bad.length ? (
                <ul className="errl">
                  {res.bad.slice(0, 6).map((b) => (
                    <li key={b.line}>
                      Wiersz {b.line}: {b.msg}
                    </li>
                  ))}
                  {res.bad.length > 6 ? <li>…i {res.bad.length - 6} kolejnych</li> : null}
                </ul>
              ) : null}
              <div className="lp-act" style={{ marginTop: 12 }}>
                <button type="button" className="btn-primary" disabled={!res.ok.length} onClick={run}>
                  Importuj {res.ok.length} {res.ok.length === 1 ? "wiersz" : "wierszy"}
                </button>
                <button type="button" className="btn" onClick={clear}>
                  Wyczyść
                </button>
              </div>
            </>
          )}
        </section>
      ) : (
        <div className="es" style={{ marginTop: 0 }}>
          <h3>Nie wybrano pliku</h3>
          <p>
            Wybierz rodzaj danych, a potem wgraj plik albo wklej jego zawartość. Zobaczysz podgląd i kontrolę błędów przed zapisem.
          </p>
        </div>
      )}
    </div>
  );
}
