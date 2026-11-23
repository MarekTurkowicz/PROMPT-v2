import { useDemo, openTask } from "@/demo/store";

// Port of mock.html vTD() (+ tdMain, tdSide). Mounted once in AppShell; renders only while store.taskOpen is set.
export default function TaskPanel() {
  const { taskOpen } = useDemo();
  if (taskOpen == null) return null;
  return (
    <div className="mk">
      <p>TODO</p>
      <button type="button" onClick={() => openTask(null)}>
        Zamknij
      </button>
    </div>
  );
}
