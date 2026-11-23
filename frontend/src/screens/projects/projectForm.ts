// Port of the mock's projectForm(p).
import { PS_PL, type ProjectStatus } from "@/demo/core";
import type { Project } from "@/demo/data";
import { activeMem, memUsers, uname } from "@/demo/helpers";
import { logAudit, nextId, store, update } from "@/demo/store";
import { bad, openForm, toast } from "@/demo/ui";

export function openProjectForm(p?: Project) {
  openForm(
    p ? "Edytuj projekt" : "Dodaj projekt",
    [
      { id: "name", label: "Nazwa *", value: p?.name || "", required: 1, full: 1 },
      { id: "desc", label: "Opis", type: "textarea", value: p?.description || "" },
      { id: "status", label: "Status", type: "select", options: Object.entries(PS_PL), value: p?.status || "planned" },
      {
        id: "owner",
        label: "Właściciel",
        type: "select",
        options: memUsers()
          .filter((u) => activeMem(u.id))
          .map((u): [number, string] => [u.id, uname(u)]),
        value: p?.owner || store.ME,
      },
      { id: "start", label: "Start", type: "date", value: p?.start || "" },
      { id: "end", label: "Koniec", type: "date", value: p?.end || "" },
    ],
    p ? "Zapisz" : "Utwórz",
    (v) => {
      const d = {
        name: v.name.trim(),
        description: v.desc.trim(),
        status: v.status as ProjectStatus,
        owner: +v.owner,
        start: v.start || null,
        end: v.end || null,
      };
      if (d.start && d.end && d.end < d.start) return bad("Koniec projektu nie może być przed startem.");
      if (p) {
        update(() => Object.assign(p, d, { updated: 0 }));
        logAudit("update", "project", d.name, "", { pid: p.id });
        toast("Zaktualizowano projekt");
      } else {
        const id = nextId("project");
        update((s) => s.PROJECTS.unshift({ id, funds: [], hidden: [], created: 0, updated: 0, ...d }));
        logAudit("create", "project", d.name, "", { pid: id });
        toast("Utworzono projekt");
      }
    },
  );
}
