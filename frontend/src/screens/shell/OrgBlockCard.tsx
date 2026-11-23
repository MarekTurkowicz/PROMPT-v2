// Port of mock.html orgBlockCard(): "Blokada organizacji" card for the org settings screen (admin/settings).
import { useNavigate } from "react-router-dom";
import { store, useDemo } from "@/demo/store";
import { useState } from "react";
import { requestBlockOrg } from "./orgs";

export function OrgBlockCard() {
  const s = useDemo();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const block = () => {
    const o = store.ORGS.find((x) => x.id === s.orgId);
    if (!o) return;
    const res = requestBlockOrg(o, () => navigate("/overview"));
    if (res) setError(res.error);
  };

  return (
    <section className="card" style={{ marginTop: 14, borderColor: "#fecaca" }}>
      <h2 className="sh">Blokada organizacji</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Administrator systemu może zablokować organizację (<code>organization.is_active</code>). Jej członkowie tracą
        dostęp do jej danych, a w przełączniku organizacja ma oznaczenie „zablokowana” – stamtąd ją odblokujesz.
      </p>
      {error ? (
        <p className="m-err" role="alert">
          {error}
        </p>
      ) : null}
      <button type="button" className="btn-danger" onClick={block}>
        Zablokuj tę organizację
      </button>
    </section>
  );
}
