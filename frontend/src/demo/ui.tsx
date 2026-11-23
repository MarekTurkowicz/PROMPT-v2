// Small React pieces shared by the ported mock screens. Class names come from mock.css (scope: .mk).
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import rhToast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PR_PL,
  ST_PL,
  ST_UP,
  type ChipColor,
  type TaskCat,
} from "./core";
import { actorName, initials, isOverdue, lblOf, stOf, user, type ProjStats } from "./helpers";
import { openTask } from "./store";
import type { Task } from "./data";

/* ---- chips ---- */
export function Chip({ c, children }: { c: ChipColor | string; children: ReactNode }) {
  return <span className={"chip " + c}>{children}</span>;
}

/** Status chip: pass a task (org status colour) or a category key. */
export function StatusChip({ task, cat, up }: { task?: Task; cat?: TaskCat; up?: boolean }) {
  const s = task ? stOf(task) : undefined;
  if (s) {
    return (
      <span className="chip st" style={{ "--sc": s.color } as React.CSSProperties}>
        {up ? s.name.toUpperCase() : s.name}
      </span>
    );
  }
  const k = cat ?? task?.status ?? "todo";
  const c = k === "done" ? "green" : k === "doing" ? "amber" : k === "cancelled" ? "red" : "gray";
  return <Chip c={c}>{(up ? ST_UP : ST_PL)[k]}</Chip>;
}

export function PrioChip({ prio }: { prio: number }) {
  return <Chip c={prio >= 4 ? "red" : prio === 3 ? "amber" : "sky"}>{PR_PL[prio]}</Chip>;
}

export function LabelChips({ task }: { task: Task }) {
  return (
    <>
      {lblOf(task).map((l) => (
        <span key={l.id} className="lbl" style={{ "--lc": l.color } as React.CSSProperties}>
          {l.name}
        </span>
      ))}
    </>
  );
}

/** "• Termin: …" meta line (red when overdue). */
export function Due({ task }: { task: Task }) {
  if (!task.due) return null;
  const late = isOverdue(task);
  return (
    <span className={"meta-t" + (late ? " late" : "")}>
      • Termin: {task.due}
      {late ? " (po terminie)" : ""}
    </span>
  );
}

/** Dashed "propozycja schematu" pill with a tooltip. */
export function Prop({ why }: { why: string }) {
  return (
    <span className="prop" tabIndex={0} data-tip={"Propozycja schematu|" + why}>
      propozycja schematu
    </span>
  );
}

export function Avatar({
  id,
  small,
  className,
}: {
  /** User id. */
  id: number;
  small?: boolean;
  className?: string;
}) {
  const u = user(id);
  return (
    <span
      className={"av" + (className ? " " + className : "")}
      style={small ? { width: 22, height: 22, fontSize: ".6rem" } : undefined}
      title={actorName(id)}
    >
      {initials(u ?? { email: "??" })}
    </span>
  );
}

export function EmptyState({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="es">
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 28l6-16h24l6 16" />
        <path d="M6 28v10a2 2 0 0 0 2 2h32a2 2 0 0 0 2-2V28H30a6 6 0 0 1-12 0H6z" />
      </svg>
      <h3>{title}</h3>
      <p>{text}</p>
      {children ? <div className="row">{children}</div> : null}
    </div>
  );
}

/** Button that opens a task in the task panel. */
export function TaskLink({ id, children }: { id: number; children: ReactNode }) {
  return (
    <button type="button" className="tlink" onClick={() => openTask(id)}>
      {children}
    </button>
  );
}

/** Progress block of a project list item / overview. */
export function ProjProgress({ s }: { s: ProjStats }) {
  if (!s.n) {
    return <div className="pbar muted">Brak zadań – postęp pojawi się po dodaniu pierwszego.</div>;
  }
  const behind = s.tp != null && s.pct + 5 < s.tp;
  return (
    <div className="pbar">
      <div className="prog-l">
        <span>
          Postęp <b>{s.pct}%</b> · zrobione {s.d}/{s.n}
        </span>
        {s.tp != null ? <span className="muted">upływ czasu {s.tp}%</span> : null}
      </div>
      <div
        className="prog-t pt2"
        role="img"
        aria-label={`Postęp ${s.pct}%${s.tp != null ? ", upływ czasu " + s.tp + "%" : ""}`}
      >
        <i style={{ width: s.pct + "%", background: behind ? "#f59e0b" : "#6366f1" }} />
        {s.tp != null ? (
          <span className="tmark" style={{ left: s.tp + "%" }} title={`Dziś: upłynęło ${s.tp}% czasu projektu`} />
        ) : null}
      </div>
      <div className="pstats">
        {behind ? <Chip c="amber">Za planem</Chip> : null}
        {s.over ? <Chip c="red">{s.over} po terminie</Chip> : null}
        {s.bp != null ? <span className="meta-t">Budżet wykorzystany: {s.bp}%</span> : null}
        {s.ppl.length ? (
          <span className="avs" aria-label={"Osoby z otwartymi zadaniami: " + s.ppl.length}>
            {s.ppl.slice(0, 5).map((u) => (
              <Avatar key={u} id={u} small />
            ))}
            {s.ppl.length > 5 ? <span className="meta-t">&nbsp;+{s.ppl.length - 5}</span> : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ---- toast ---- */
export function toast(msg: string, o: { label?: string; fn?: () => void; ms?: number } = {}) {
  const duration = o.ms ?? 2600;
  if (!o.fn) return rhToast(msg, { duration });
  return rhToast(
    (t) => (
      <span className="flex items-center gap-3">
        {msg}
        <button
          type="button"
          className="font-semibold underline"
          onClick={() => {
            o.fn!();
            rhToast.dismiss(t.id);
          }}
        >
          {o.label ?? "Cofnij"}
        </button>
      </span>
    ),
    { duration },
  );
}

/* ---- dialogs (port of openForm / openConfirm / vModal) ---- */
export interface FieldSpec {
  id: string;
  label: string;
  type?: "text" | "textarea" | "select" | "date" | "number" | "file" | "email" | "password";
  value?: string | number | null;
  required?: boolean | 0 | 1;
  full?: boolean | 0 | 1;
  options?: [string | number, string][];
  accept?: string;
}
export interface FormError {
  error: string;
}
/** Return from onSubmit to keep the form open with a message (port of the mock's `bad`). */
export const bad = (msg: string): FormError => ({ error: msg });
export type FormValues = Record<string, string>;
export type FormSubmit = (v: FormValues, files: Record<string, File | undefined>) => FormError | void;

type DialogState =
  | { kind: "form"; title: string; fields: FieldSpec[]; submit: string; onSubmit: FormSubmit }
  | { kind: "confirm"; text: string; yes: string; no: string; onYes: () => void }
  | { kind: "info"; title: string; body: ReactNode };

let dialogState: DialogState | null = null;
const dialogListeners = new Set<() => void>();
const setDialog = (s: DialogState | null) => {
  dialogState = s;
  dialogListeners.forEach((l) => l());
};
export const closeDialog = () => setDialog(null);
export const openForm = (title: string, fields: FieldSpec[], submit: string, onSubmit: FormSubmit) =>
  setDialog({ kind: "form", title, fields, submit, onSubmit });
export const openConfirm = (text: string, onYes: () => void, yes = "Usuń", no = "Anuluj") =>
  setDialog({ kind: "confirm", text, onYes, yes, no });
export const openInfo = (title: string, body: ReactNode) => setDialog({ kind: "info", title, body });

const ERR_FIELD: [RegExp, string[]][] = [
  [/termin|liczba dni/i, ["due"]],
  [/koniec/i, ["end", "a1"]],
  [/kwot|alokac/i, ["amount", "alloc"]],
  [/szacun/i, ["est"]],
  [/kolor/i, ["color"]],
  [/nip/i, ["nip"]],
  [/e-mail|członkostw/i, ["email", "memail"]],
  [/zdjęci/i, ["avatar"]],
  [/uzasadn/i, ["reason"]],
  [/skan/i, ["scan"]],
  [/dat/i, ["date"]],
  [/główne/i, ["primary"]],
  [/uprawnie|administrator/i, ["role"]],
  [/podpięt|finansowan/i, ["funding", "pf"]],
  [/nazw|tytuł/i, ["name", "title"]],
];
const fieldForError = (msg: string, ids: string[]) => {
  const hit = ERR_FIELD.find(([re, c]) => re.test(msg) && c.some((i) => ids.includes(i)));
  return hit ? hit[1].find((i) => ids.includes(i)) : undefined;
};

function FieldInput({
  f,
  value,
  onChange,
  invalid,
}: {
  f: FieldSpec;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
}) {
  const id = "f-" + f.id;
  const common = {
    id,
    name: f.id,
    "aria-invalid": invalid || undefined,
    "aria-describedby": invalid ? "m-err" : undefined,
  };
  if (f.type === "select") {
    return (
      <select {...common} value={value} onChange={(e) => onChange(e.target.value)}>
        {(f.options ?? []).map(([v, l]) => (
          <option key={String(v)} value={String(v)}>
            {l}
          </option>
        ))}
      </select>
    );
  }
  if (f.type === "textarea") {
    return <textarea {...common} value={value} required={!!f.required} onChange={(e) => onChange(e.target.value)} />;
  }
  if (f.type === "file") {
    return <input {...common} type="file" accept={f.accept ?? ""} onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")} />;
  }
  return (
    <input
      {...common}
      type={f.type ?? "text"}
      value={value}
      required={!!f.required}
      min={f.type === "number" ? 0 : undefined}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Generic form dialog: fields spec -> shadcn Dialog; onSubmit returns bad(msg) to show an error under the title. */
export function FormDialog({
  title,
  fields,
  submit,
  onSubmit,
  onClose,
}: {
  title: string;
  fields: FieldSpec[];
  submit: string;
  onSubmit: FormSubmit;
  onClose: () => void;
}) {
  const [values, setValues] = useState<FormValues>(() =>
    Object.fromEntries(fields.map((f) => [f.id, f.value == null ? "" : String(f.value)])),
  );
  const [err, setErr] = useState<{ msg: string; field?: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!err) return;
    const el = err.field ? formRef.current?.querySelector<HTMLElement>("#f-" + err.field) : null;
    (el ?? document.getElementById("m-err"))?.focus();
  }, [err]);

  const run = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const files: Record<string, File | undefined> = {};
    fields.forEach((f) => {
      if (f.type === "file") {
        const input = formRef.current?.querySelector<HTMLInputElement>("#f-" + f.id);
        files[f.id] = input?.files?.[0];
      }
    });
    const res = onSubmit(values, files);
    if (res && "error" in res) {
      setErr({ msg: res.error, field: fieldForError(res.error, fields.map((f) => f.id)) });
      return;
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="mk sm:max-w-xl">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="sr-only">{title}</DialogDescription>
        <form ref={formRef} onSubmit={run}>
          {err ? (
            <p className="m-err" id="m-err" role="alert" tabIndex={-1}>
              {err.msg}
            </p>
          ) : null}
          <div className="m-grid">
            {fields.map((f) => (
              <div key={f.id} className={"m-f" + (f.type === "textarea" || f.full ? " full" : "")}>
                <label htmlFor={"f-" + f.id}>{f.label}</label>
                <FieldInput
                  f={f}
                  value={values[f.id]}
                  invalid={err?.field === f.id}
                  onChange={(v) => setValues((s) => ({ ...s, [f.id]: v }))}
                />
              </div>
            ))}
          </div>
          <div className="m-foot">
            <button type="button" className="btn" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="btn-primary">
              {submit}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Mount once (AppShell): renders whatever openForm / openConfirm / openInfo requested. */
export function DemoDialogs() {
  const s = useSyncExternalStore(
    (l) => {
      dialogListeners.add(l);
      return () => dialogListeners.delete(l);
    },
    () => dialogState,
  );
  if (!s) return null;
  if (s.kind === "form") return <FormDialog key={s.title} {...s} onClose={closeDialog} />;
  if (s.kind === "confirm") {
    return (
      <Dialog open onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="mk sm:max-w-md" showCloseButton={false}>
          <DialogTitle>Potwierdzenie</DialogTitle>
          <DialogDescription className="m-p">{s.text}</DialogDescription>
          <div className="m-foot">
            <button type="button" className="btn" onClick={closeDialog}>
              {s.no}
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                closeDialog();
                s.onYes();
              }}
            >
              {s.yes}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Dialog open onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="mk sm:max-w-xl">
        <DialogTitle>{s.title}</DialogTitle>
        <DialogDescription className="sr-only">{s.title}</DialogDescription>
        {s.body}
        <div className="m-foot">
          <button type="button" className="btn" onClick={closeDialog}>
            Zamknij
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Mount once: floating tooltip for any `[data-tip="Title|line|line"]` element inside `.mk`. */
export function DataTip() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  useEffect(() => {
    const find = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>("[data-tip]") : null);
    const move = (e: MouseEvent) => {
      const el = find(e.target);
      setTip(el ? { text: el.dataset.tip!, x: e.clientX, y: e.clientY } : null);
    };
    const focus = (e: FocusEvent) => {
      const el = find(e.target);
      if (!el || !el.hasAttribute("tabindex")) return;
      const r = el.getBoundingClientRect();
      setTip({ text: el.dataset.tip!, x: r.left, y: r.bottom - 8 });
    };
    const hide = () => setTip(null);
    document.addEventListener("mousemove", move);
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", hide);
    document.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("scroll", hide, true);
    };
  }, []);
  const left = tip ? Math.max(8, Math.min(tip.x + 14, window.innerWidth - 276)) : 0;
  const top = tip ? Math.max(8, Math.min(tip.y + 14, window.innerHeight - 80)) : 0;
  return (
    <div className="mk">
      <div
        id="tip"
        role="tooltip"
        style={{ display: tip ? "block" : "none", left, top }}
      >
        {tip?.text.split("|").map((l, i) => (i ? <div key={i}>{l}</div> : <b key={i}>{l}</b>))}
      </div>
    </div>
  );
}
