// Ports of the mock's fundForm(f) and tplForm(x, fid).
import { FT_PL, PR_PL, type FundingType } from "@/demo/core";
import type { Funding, TaskTemplate } from "@/demo/data";
import { curOrg, fName } from "@/demo/helpers";
import { logAudit, nextId, store, update } from "@/demo/store";
import { bad, openForm, toast } from "@/demo/ui";

export function openFundingForm(f?: Funding) {
  openForm(
    f ? "Edytuj finansowanie" : "Dodaj finansowanie",
    [
      { id: "name", label: "Nazwa *", value: f?.name || "", required: 1, full: 1 },
      { id: "program", label: "Program", value: f?.program || "" },
      { id: "funder", label: "Instytucja", value: f?.funder || "" },
      { id: "agr", label: "Numer umowy", value: f?.agr || "" },
      { id: "type", label: "Typ", type: "select", options: Object.entries(FT_PL), value: f?.type || "grant" },
      { id: "amount", label: "Kwota *", type: "number", value: f?.amount ?? "" },
      {
        id: "cur",
        label: "Waluta",
        type: "select",
        options: ["PLN", "EUR", "USD", "GBP"].map((c) => [c, c]),
        value: f?.cur || curOrg(),
      },
      { id: "start", label: "Start", type: "date", value: f?.start || "" },
      { id: "end", label: "Koniec", type: "date", value: f?.end || "" },
      { id: "report", label: "Termin raportu", type: "date", value: f?.report || "" },
      { id: "desc", label: "Opis", type: "textarea", value: f?.desc || "" },
    ],
    f ? "Zapisz" : "Dodaj",
    (v) => {
      const d = {
        name: v.name.trim(),
        program: v.program.trim(),
        funder: v.funder.trim(),
        agr: v.agr.trim(),
        amount: +v.amount || 0,
        cur: v.cur,
        type: v.type as FundingType,
        start: v.start || null,
        end: v.end || null,
        report: v.report || null,
        desc: v.desc.trim(),
      };
      if (!(d.amount > 0)) return bad("Kwota finansowania musi być większa od zera.");
      if (d.start && d.end && d.end < d.start) return bad("Koniec finansowania nie może być przed startem.");
      if (f) {
        update(() => Object.assign(f, d));
        logAudit("update", "funding", d.name);
        toast("Zaktualizowano finansowanie");
      } else {
        update((s) => s.FUNDINGS.unshift({ id: nextId("funding"), created: 0, ...d }));
        logAudit("create", "funding", d.name);
        toast("Dodano finansowanie");
      }
    },
  );
}

export function openTemplateForm(x: TaskTemplate | null, fid: number) {
  openForm(
    x ? "Edytuj szablon zadania" : "Nowy szablon zadania",
    [
      { id: "title", label: "Tytuł *", value: x?.title || "", required: 1, full: 1 },
      { id: "desc", label: "Opis", type: "textarea", value: x?.desc || "" },
      {
        id: "prio",
        label: "Priorytet",
        type: "select",
        options: [1, 2, 3, 4, 5].map((i) => [i, i + " · " + PR_PL[i]]),
        value: x?.prio || 3,
      },
      { id: "est", label: "Szacunek (h)", type: "number", value: x?.est ?? "" },
      { id: "due", label: "Termin: dni od początku alokacji", type: "number", value: x ? (x.dueDays ?? "") : 30 },
      {
        id: "st",
        label: "Status domyślny",
        type: "select",
        options: [
          ["", "Domyślny organizacji"],
          ...store.STATUSES.filter((s) => s.project == null && s.active).map((s): [number, string] => [s.id, s.name]),
        ],
        value: x?.status ?? "",
      },
    ],
    x ? "Zapisz" : "Dodaj",
    (v) => {
      const est = v.est === "" ? null : +v.est;
      const due = v.due === "" ? null : +v.due;
      if (est != null && !(est > 0)) return bad("Szacunek musi być większy od zera.");
      if (due != null && due < 0) return bad("Liczba dni nie może być ujemna.");
      const d = {
        title: v.title.trim(),
        desc: v.desc.trim(),
        prio: +v.prio,
        est: est ?? 0,
        dueDays: due,
        status: v.st === "" ? null : +v.st,
      };
      if (x) {
        update(() => Object.assign(x, d));
        logAudit("update", "task_template", d.title, "Finansowanie „" + fName(x.funding) + "”");
        toast("Zapisano szablon. Zadania utworzone wcześniej się nie zmieniają.");
        return;
      }
      update((s) => s.TEMPL.push({ id: nextId("template"), funding: fid, ...d }));
      logAudit("create", "task_template", d.title, "Finansowanie „" + fName(fid) + "”");
      toast("Dodano szablon. Nie tworzy zadań w już podpiętych projektach.");
    },
  );
}
