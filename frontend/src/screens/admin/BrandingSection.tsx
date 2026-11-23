// Port of mock.html aBrand(), readLogo and the brand-* actions.
import { useState } from "react";
import type { Brand } from "@/demo/data";
import { logAudit, update, useDemo } from "@/demo/store";
import { toast } from "@/demo/ui";
import { ACC_PRESETS, NAV_PRESETS, applyBrand, brandVars, defaultBrand, ratio } from "./brand";

const KEYS = ["name", "tag", "accent", "nav", "logo"] as const;
const LABELS: Record<(typeof KEYS)[number], string> = {
  name: "nazwa",
  tag: "podtytuł",
  accent: "kolor akcentu",
  nav: "kolor panelu",
  logo: "logo",
};

function BrandMark({ b }: { b: Brand }) {
  return b.logo ? (
    <img className="sb-logo" src={b.logo} alt="" />
  ) : (
    <span className="sb-mark" aria-hidden="true">
      {((b.name || "P").trim()[0] || "P").toUpperCase()}
    </span>
  );
}

function Verdict({ v, min }: { v: number; min: number }) {
  return v >= min ? (
    <span className="ok">{v.toFixed(1)}:1, zgodne z WCAG AA</span>
  ) : (
    <span className="warn">
      {v.toFixed(1)}:1, poniżej zalecanych {min}:1
    </span>
  );
}

export default function BrandingSection() {
  const s = useDemo();
  const [draft, setDraft] = useState<Brand | null>(null);
  const [logoErr, setLogoErr] = useState("");
  const B = s.brand;
  const D = draft ?? B;
  const dirty = KEYS.some((k) => D[k] !== B[k]);
  const vars = brandVars(D);
  const set = (p: Partial<Brand>) => setDraft({ ...D, ...p });

  const readLogo = (f: File | undefined) => {
    if (!f) return;
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type)) return setLogoErr("Obsługiwane formaty: PNG, JPG, WebP, SVG.");
    if (f.size > 512 * 1024) return setLogoErr("Plik jest za duży (maks. 512 KB).");
    setLogoErr("");
    const r = new FileReader();
    r.onload = () => set({ logo: String(r.result) });
    r.readAsDataURL(f);
  };

  const save = () => {
    if (!D.name.trim()) return toast("Nazwa nie może być pusta.");
    const next = { ...D, name: D.name.trim() };
    const ch = KEYS.filter((k) => next[k] !== B[k]).map((k) => LABELS[k]);
    update((st) => {
      st.brand = next;
    });
    applyBrand(next);
    setDraft(null);
    logAudit("branding", "branding", "Ustawienia marki", ch.join(", "));
    toast("Zapisano ustawienia marki");
  };

  const swatches = (key: "accent" | "nav", list: string[], label: string) =>
    list.map((c) => (
      <button
        key={c}
        type="button"
        className={"sw" + (D[key].toLowerCase() === c ? " on" : "")}
        style={{ background: c }}
        aria-label={label + " " + c}
        aria-pressed={D[key].toLowerCase() === c}
        onClick={() => set({ [key]: c })}
      />
    ));

  return (
    <div className="mk" style={vars as React.CSSProperties}>
      <header className="ah">
        <div>
          <h1>Branding</h1>
          <p>
            Nazwa, logo i kolory aplikacji. Podgląd po prawej pokazuje zmiany od razu, ale zapisują się dopiero po kliknięciu „Zapisz
            zmiany”.
          </p>
        </div>
      </header>
      <div className="bgrid">
        <div>
          <section className="card">
            <h2 className="sh">Nazwa</h2>
            <div className="fld">
              <label htmlFor="bname">Nazwa aplikacji</label>
              <input type="text" id="bname" maxLength={28} value={D.name} onChange={(e) => set({ name: e.target.value })} />
            </div>
            <div className="fld" style={{ marginBottom: 0 }}>
              <label htmlFor="btag">Podtytuł (pasek u góry i ekran logowania)</label>
              <input type="text" id="btag" maxLength={60} value={D.tag} onChange={(e) => set({ tag: e.target.value })} />
            </div>
          </section>
          <section className="card">
            <h2 className="sh">Logo</h2>
            <div className="logo-row">
              <div className="logo-box">{D.logo ? <img src={D.logo} alt="Podgląd logo" /> : <span className="muted">Brak</span>}</div>
              <div>
                <input
                  type="file"
                  className="fileinp"
                  id="logo"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => {
                    readLogo(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <label className="btn" htmlFor="logo" style={{ borderColor: "#e2e8f0" }}>
                  Wgraj logo
                </label>
                {D.logo ? (
                  <>
                    {" "}
                    <button type="button" className="btn" onClick={() => set({ logo: null })}>
                      Usuń logo
                    </button>
                  </>
                ) : null}
                {logoErr ? (
                  <p className="m-err" role="alert">
                    {logoErr}
                  </p>
                ) : null}
                <p className="muted" style={{ margin: "8px 0 0" }}>
                  PNG, JPG, WebP lub SVG, do 512 KB. Najlepiej kwadratowe, co najmniej 128 × 128 px. Bez logo pokazujemy pierwszą literę nazwy.
                </p>
              </div>
            </div>
          </section>
          <section className="card">
            <h2 className="sh">Kolory</h2>
            <div className="fld">
              <label htmlFor="cacc">Kolor akcentu (przyciski, aktywne zakładki, linki)</label>
              <div className="sws">
                <input type="color" id="cacc" value={D.accent} onChange={(e) => set({ accent: e.target.value })} />
                {swatches("accent", ACC_PRESETS, "Akcent")}
                <code>{D.accent}</code>
              </div>
              <div>
                Biały tekst na akcencie: <Verdict v={ratio(D.accent, "#ffffff")} min={4.5} />
              </div>
            </div>
            <div className="fld" style={{ marginBottom: 0 }}>
              <label htmlFor="cnav">Kolor panelu bocznego</label>
              <div className="sws">
                <input type="color" id="cnav" value={D.nav} onChange={(e) => set({ nav: e.target.value })} />
                {swatches("nav", NAV_PRESETS, "Panel")}
                <code>{D.nav}</code>
              </div>
              <div>
                Tekst na panelu: <Verdict v={ratio(D.nav, vars["--nav-strong"])} min={4.5} />
              </div>
            </div>
          </section>
          <div className="lp-act">
            <button type="button" className="btn-primary" disabled={!dirty} onClick={save}>
              Zapisz zmiany
            </button>
            <button type="button" className="btn" disabled={!dirty} onClick={() => setDraft(null)}>
              Anuluj zmiany
            </button>
            <button type="button" className="btn" onClick={() => setDraft(defaultBrand())}>
              Przywróć domyślne
            </button>
          </div>
        </div>
        <aside className="bprev">
          <section className="card">
            <h2 className="sh">Podgląd</h2>
            <div className="bp" style={vars as React.CSSProperties}>
              <div className="bp-sb">
                <div className="bp-brand">
                  <BrandMark b={D} />
                  <b>{D.name || "Nazwa"}</b>
                </div>
                <div className="bp-n on">Przegląd</div>
                <div className="bp-n">Projekty</div>
                <div className="bp-n">Zadania</div>
              </div>
              <div className="bp-main">
                <div className="bp-h">Przykładowy ekran</div>
                <div className="bp-row">
                  <span className="btn-primary">Dodaj projekt</span>
                  <span className="chip-btn on">Aktywne</span>
                </div>
                <span className="pd-tab on">Overview</span>
                <div className="muted">{D.tag}</div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
