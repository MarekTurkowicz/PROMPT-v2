// Pieces shared by the project tabs ported in part 1 (overview, tasks, kanban, milestones, timeline).
import { useState } from "react";
import { useParams } from "react-router-dom";
import type { Task } from "@/demo/data";
import { projectOf } from "@/demo/helpers";
import { logAudit, nextId, store, update, useDemo } from "@/demo/store";
import {
  Avatar,
  Chip,
  Due,
  LabelChips,
  PrioChip,
  Prop,
  StatusChip,
  TaskLink,
  bad,
  openForm,
  toast,
} from "@/demo/ui";

export function useProject() {
  useDemo();
  const { projectId } = useParams();
  return projectOf(projectId);
}

export const LblProp = () => (
  <Prop why="label (organization_id, name, color) i task_label (task_id, label_id) – w modelu nie ma etykiet zadań (uwaga z przeglądu makiety)." />
);

export function LabelFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="form-input lbl-f" aria-label="Filtr etykiety" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Wszystkie etykiety</option>
      {store.LABELS.map((l) => (
        <option key={l.id} value={l.id}>
          {l.name}
        </option>
      ))}
    </select>
  );
}

export function openLabelForm() {
  openForm(
    "Nowa etykieta",
    [
      { id: "name", label: "Nazwa *", value: "", required: 1, full: 1 },
      { id: "color", label: "Kolor (#RRGGBB)", value: "#6366f1" },
    ],
    "Dodaj",
    (v) => {
      const name = v.name.trim();
      const color = v.color.trim().toLowerCase();
      if (!name) return bad("Podaj nazwę etykiety.");
      if (!/^#[0-9a-f]{6}$/.test(color)) return bad("Kolor musi mieć format #RRGGBB.");
      if (store.LABELS.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
        return bad("Etykieta o tej nazwie już istnieje w organizacji.");
      }
      update((s) => {
        s.LABELS.push({ id: nextId("label"), org: s.orgId, name, color });
      });
      logAudit("create", "label", name);
      toast("Dodano etykietę „" + name + "”");
    },
  );
}

export function SubBlock({ subs }: { subs: Task[] }) {
  const [open, setOpen] = useState(false);
  const d = subs.filter((x) => x.status === "done").length;
  const pc = Math.round((d / subs.length) * 100);
  return (
    <div className="subs-w">
      <button type="button" className="sub-tg" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="chev" aria-hidden="true">
          ▸
        </span>
        Podzadania {d}/{subs.length}
        <span className="prog-t sub-p" aria-hidden="true">
          <i style={{ width: pc + "%", background: "#22c55e" }} />
        </span>
      </button>
      {open ? (
        <div className="subs">
          {subs.map((x) => (
            <div className="sub" key={x.id}>
              <TaskLink id={x.id}>{x.title}</TaskLink>
              <span className="row2">
                <StatusChip task={x} />
                {x.assg.map((u) => (
                  <Avatar key={u} id={u} small />
                ))}
                {!x.assg.length && x.group ? <Chip c="sky">Pula</Chip> : null}
                <Due task={x} />
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TaskMetaChips({ t }: { t: Task }) {
  return (
    <>
      <PrioChip prio={t.prio} />
      {t.mand ? <Chip c="red">Obowiązkowe</Chip> : null}
      <LabelChips task={t} />
    </>
  );
}
