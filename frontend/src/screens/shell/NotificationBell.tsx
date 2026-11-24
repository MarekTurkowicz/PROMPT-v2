// Port of mock.html vBell(): notification bell with a popover (tabs, mark read, click opens the task).
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ago } from "@/demo/core";
import { openTask, update, useDemo } from "@/demo/store";
import { Prop } from "@/demo/ui";

export function NotificationBell() {
  const s = useDemo();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!s.bell) return;
    const away = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) update((st) => void (st.bell = false));
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && update((st) => void (st.bell = false));
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [s.bell]);

  const un = s.NOTIF.filter((n) => !n.read).length;
  const list = (filter === "unread" ? s.NOTIF.filter((n) => !n.read) : s.NOTIF)
    .slice()
    .sort((a, b) => b.ts.getTime() - a.ts.getTime());

  const open = (id: number) => {
    const n = s.NOTIF.find((x) => x.id === id);
    if (!n) return;
    update((st) => {
      n.read = true;
      st.bell = false;
    });
    if (n.tid && s.TASKS.some((t) => t.id === n.tid)) openTask(n.tid);
  };

  return (
    <div className="mk" style={{ display: "contents" }} ref={ref}>
      <button
        type="button"
        className="bell"
        style={{ position: "relative", top: 0, right: 0, width: 38, height: 38, boxShadow: "none" }}
        aria-expanded={s.bell}
        aria-label={"Powiadomienia" + (un ? ", nieprzeczytane: " + un : "")}
        onClick={() => update((st) => void (st.bell = !st.bell))}
      >
        <Bell aria-hidden="true" />
        {un ? <b aria-hidden="true">{un > 9 ? "9+" : un}</b> : null}
      </button>
      {s.bell && (
        <div className="bell-pop" role="dialog" aria-label="Powiadomienia" style={{ top: 64 }}>
          <div className="bp-hd">
            <h2>Powiadomienia</h2>
            {un ? (
              <button
                type="button"
                className="lnk"
                style={{ margin: 0 }}
                onClick={() =>
                  update((st) =>
                    st.NOTIF.forEach((n) => {
                      n.read = true;
                    }),
                  )
                }
              >
                Oznacz wszystkie jako przeczytane
              </button>
            ) : null}
          </div>
          <div className="bp-tabs">
            {(
              [
                ["all", "Wszystkie"],
                ["unread", "Nieprzeczytane (" + un + ")"],
              ] as const
            ).map(([k, l]) => (
              <button key={k} type="button" className={"tab-s" + (filter === k ? " on" : "")} onClick={() => setFilter(k)}>
                {l}
              </button>
            ))}
          </div>
          {list.length ? (
            <ul className="bp-list">
              {list.map((n) => (
                <li key={n.id}>
                  <button type="button" className={"nt" + (n.read ? "" : " un")} onClick={() => open(n.id)}>
                    <span className="nd" aria-hidden="true" />
                    <span>
                      <b>{n.title}</b>
                      <small>{n.text}</small>
                      <small>
                        {n.kind === "reminder" ? "⏰ Przypomnienie systemowe · " : ""}
                        {ago(n.ts)}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-s" style={{ margin: "10px 14px" }}>
              Brak powiadomień.
            </div>
          )}
          <div className="bp-ft">
            Organizacja przypomnienia{" "}
            <Prop why="notification.organization_id – przypomnienie systemowe nie ma wpisu w dzienniku zdarzeń, więc bez tej kolumny nie wiadomo, do której organizacji należy (A6). Kolumna created_at jest już w modelu." />
          </div>
        </div>
      )}
    </div>
  );
}
