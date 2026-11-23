import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { ATT_OK, ago, fsize } from "@/demo/core";
import type { Comment } from "@/demo/data";
import { actorName, attErr, pName } from "@/demo/helpers";
import { logAudit, nextId, store, update } from "@/demo/store";
import { Avatar, toast } from "@/demo/ui";

function Item({ c, reply, onReply }: { c: Comment; reply?: boolean; onReply: (id: number) => void }) {
  return (
    <div className={"cm" + (reply ? " rep" : "")}>
      <div className="cm-h">
        <Avatar id={c.author} small />
        <b>{actorName(c.author)}</b>
        <span>{ago(c.ts)}</span>
        {reply ? null : (
          <button type="button" className="lnk" style={{ margin: "0 0 0 auto" }} onClick={() => onReply(c.id)}>
            Odpowiedz
          </button>
        )}
      </div>
      <p>{c.text}</p>
      {c.att.map((a, i) => (
        <div key={i} className="att">
          <Paperclip size={14} /> {a.name}
          <small>{fsize(a.size)}</small>
        </div>
      ))}
    </div>
  );
}

/** Port of cmBlock: thread of a task (`task`) or of a project (`project`) with the add-comment form. */
export default function CommentThread({ cms, task, project }: { cms: Comment[]; task?: number; project?: number }) {
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const k = task != null ? "td" : "pc";
  const roots = cms.filter((c) => !c.parent);
  const rep = replyTo != null && cms.some((c) => c.id === replyTo);

  const add = () => {
    const v = text.trim();
    if (!v) return void toast("Komentarz nie może być pusty.");
    let att: { name: string; size: number }[] = [];
    if (file) {
      const why = attErr(file);
      if (why) return void toast(why);
      att = [{ name: file.name, size: file.size }];
    }
    const t = task != null ? store.TASKS.find((x) => x.id === task) : undefined;
    update((s) => {
      s.COMS.push({
        id: nextId("comment"),
        task: task ?? null,
        project: t ? null : (project ?? null),
        author: s.ME,
        text: v,
        ts: new Date(),
        parent: rep ? replyTo : null,
        att,
      });
    });
    logAudit(
      "create",
      "comment",
      t ? t.title : pName(project),
      att.length ? "Załącznik: " + att[0].name : "",
      t ? { tid: t.id, pid: t.project ?? undefined } : { pid: project },
    );
    setText("");
    setFile(null);
    setReplyTo(null);
    if (fileRef.current) fileRef.current.value = "";
    taRef.current?.focus();
  };

  return (
    <>
      {roots.length ? (
        roots.map((r) => (
          <div key={r.id}>
            <Item c={r} onReply={setReplyTo} />
            {cms
              .filter((c) => c.parent === r.id)
              .map((c) => (
                <Item key={c.id} c={c} reply onReply={setReplyTo} />
              ))}
          </div>
        ))
      ) : (
        <div className="empty-s">Brak komentarzy.</div>
      )}
      <div style={{ marginTop: 8 }}>
        {rep ? (
          <div className="muted" style={{ marginBottom: 4 }}>
            Odpowiedź w wątku ·{" "}
            <button type="button" className="lnk" style={{ margin: 0 }} onClick={() => setReplyTo(null)}>
              anuluj
            </button>
          </div>
        ) : null}
        <textarea
          ref={taRef}
          className="td-in"
          id={k + "-cm"}
          rows={3}
          placeholder="Napisz komentarz…"
          aria-label="Treść komentarza"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="row2" style={{ justifyContent: "space-between", marginTop: 6 }}>
          <span className="row2">
            <input
              ref={fileRef}
              type="file"
              id={k + "-cmf"}
              className="fileinp"
              accept={ATT_OK.map((x) => "." + x).join(",")}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <label htmlFor={k + "-cmf"} className="mini" style={{ cursor: "pointer" }}>
              <Paperclip size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> Załącz plik
            </label>
            <span className="muted">{file?.name ?? ""}</span>
          </span>
          <button type="button" className="mini pri" onClick={add}>
            {rep ? "Odpowiedz" : "Dodaj komentarz"}
          </button>
        </div>
      </div>
    </>
  );
}
