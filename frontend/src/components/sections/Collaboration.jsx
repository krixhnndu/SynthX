import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";

export default function Collaboration({ caseId }) {
  const [comment, setComment] = useState("");
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", caseId],
    queryFn: async () => (await api.get(`/contracts/${caseId}/comments`)).data,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", caseId],
    queryFn: async () => (await api.get(`/contracts/${caseId}/assignments`)).data,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/users")).data,
  });

  // Mirror current assignments into the picker once they load (and after each save).
  useEffect(() => {
    setSelected(assignments.map((a) => a.userId));
  }, [assignments]);

  const postComment = useMutation({
    mutationFn: () => api.post(`/contracts/${caseId}/comments`, { comment }),
    onSuccess: () => {
      setComment("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["comments", caseId] });
    },
    onError: (err) => setError(err.response?.data?.detail ?? "The comment couldn't be posted."),
  });

  const saveAssignments = useMutation({
    mutationFn: () => api.put(`/contracts/${caseId}/assignments`, { userIds: selected }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["assignments", caseId] });
    },
    onError: (err) => setError(err.response?.data?.detail ?? "Assignments couldn't be saved."),
  });

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg mb-3">Comments</h3>
        {comments.length === 0 && <p className="text-sm text-ink/60 mb-3">No comments yet.</p>}
        {comments.map((c) => (
          <div key={c.id} className="bg-white border border-rule rounded p-4 mb-2">
            <div className="flex justify-between text-xs text-ink/50 mb-1">
              <span className="font-medium text-ink">{c.author}</span>
              <span>{new Date(c.at).toLocaleString()}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{c.body}</p>
          </div>
        ))}
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment"
          className="w-full border border-rule rounded px-3 py-2 mb-2 text-sm"
        />
        <button
          onClick={() => postComment.mutate()}
          disabled={!comment.trim() || postComment.isPending}
          className="bg-ink text-paper px-4 py-2 rounded text-sm font-medium disabled:opacity-40"
        >
          Post comment
        </button>
      </div>

      <div>
        <h3 className="text-lg mb-3">Assignees</h3>
        <div className="mb-4">
          {assignments.length === 0 && <p className="text-sm text-ink/60">No one is assigned yet.</p>}
          {assignments.map((a) => (
            <span
              key={a.userId}
              className="inline-flex items-center bg-white border border-rule rounded px-2 py-1 text-xs mr-2 mb-2"
            >
              {a.name}
            </span>
          ))}
        </div>

        <div className="text-xs text-ink/50 mb-1">Assign users</div>
        <div className="max-h-48 overflow-auto border border-rule rounded bg-white mb-3">
          {users.map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-2 px-3 py-2 border-b border-rule/50 text-sm cursor-pointer"
            >
              <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} />
              {u.name} <span className="text-ink/50 text-xs">{u.email}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-severity-critical mb-3">{error}</p>}

        <button
          onClick={() => saveAssignments.mutate()}
          disabled={saveAssignments.isPending}
          className="bg-ink text-paper px-4 py-2 rounded text-sm font-medium disabled:opacity-40"
        >
          Save assignments
        </button>
      </div>
    </div>
  );
}
