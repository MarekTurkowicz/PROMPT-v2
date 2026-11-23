import { useParams } from "react-router-dom";
import { projectOf } from "@/demo/helpers";
import { useDemo } from "@/demo/store";
import CommentThread from "@/screens/task-panel/CommentThread";

// Port of mock.html vPComments().
export default function CommentsTab() {
  const s = useDemo();
  const { projectId } = useParams();
  const p = projectOf(projectId);
  if (!p) return null;
  const cms = s.COMS.filter((c) => c.project === p.id);
  return (
    <div className="mk">
      <div className="muted">Dyskusja o całym projekcie. Komentarze do zadań są w szczegółach zadań.</div>
      <div className="card">
        <CommentThread cms={cms} project={p.id} />
      </div>
    </div>
  );
}
