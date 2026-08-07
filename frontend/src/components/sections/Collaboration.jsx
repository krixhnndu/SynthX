import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import Button from "../ui/Button";
import { Checkbox, Label, TextArea } from "../ui/Inputs";
import { EmptyState, ErrorNote, Eyebrow, SectionHeading } from "../ui/Primitives";
import { formatDateTime } from "../../lib/format";

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

  const dirty =
    selected.length !== assignments.length ||
    selected.some((id) => !assignments.some((a) => a.userId === id));

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <SectionHeading title="Comments" meta={`${comments.length} on this case`} />

        <div className="mt-2">
          {comments.length === 0 ? (
            <EmptyState title="No comments">
              Notes left here are visible to everyone assigned to the case.
            </EmptyState>
          ) : (
            <div className="divide-y divide-rule border-b border-rule">
              {comments.map((c) => (
                <div key={c.id} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <span className="text-sm text-ink">{c.author}</span>
                    <span className="font-mono text-2xs text-faint">{formatDateTime(c.at)}</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 max-w-2xl">
          <Label htmlFor="new-comment">Add a comment</Label>
          <TextArea
            id="new-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mb-3"
          />
          <Button
            variant="primary"
            onClick={() => postComment.mutate()}
            disabled={!comment.trim() || postComment.isPending}
          >
            {postComment.isPending ? "Posting" : "Post comment"}
          </Button>
        </div>
      </div>

      <div className="min-w-0">
        <SectionHeading title="Assignees" meta={`${assignments.length} assigned`} />

        <div className="mt-4">
          <Eyebrow>Currently on this case</Eyebrow>
          <div className="mt-2">
            {assignments.length === 0 ? (
              <p className="text-xs text-faint">No one is assigned yet.</p>
            ) : (
              <ul className="space-y-1">
                {assignments.map((a) => (
                  <li key={a.userId} className="border-l border-ruleHi pl-3 text-sm text-ink">
                    {a.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Eyebrow className="mb-2">Assign people</Eyebrow>
          <div className="max-h-64 divide-y divide-rule overflow-y-auto border border-rule bg-surface">
            {users.map((u) => (
              <div key={u.id} className="px-3 py-2">
                <Checkbox
                  label={u.name}
                  hint={u.email}
                  checked={selected.includes(u.id)}
                  onChange={() => toggle(u.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {error && <ErrorNote className="mt-4">{error}</ErrorNote>}

        <Button
          className="mt-4 w-full"
          variant="primary"
          onClick={() => saveAssignments.mutate()}
          disabled={saveAssignments.isPending || !dirty}
        >
          {saveAssignments.isPending ? "Saving" : "Save assignments"}
        </Button>
      </div>
    </div>
  );
}
