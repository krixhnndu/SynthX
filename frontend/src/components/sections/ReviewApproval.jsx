import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";

const ACTIONS = [
  { decision: "approve", label: "Approve" },
  { decision: "request_changes", label: "Request changes" },
  { decision: "reject", label: "Reject" },
];

export default function ReviewApproval({ contractCase, caseId }) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: (decision) => api.post(`/contracts/${caseId}/review`, { decision, comment }),
    onSuccess: () => {
      setComment("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    },
    onError: (err) =>
      setError(
        err.response?.status === 403
          ? "Your role can't make that decision on a case at this risk level."
          : err.response?.data?.detail ?? "The decision couldn't be recorded."
      ),
  });

  const decisions = contractCase?.review?.decisions ?? [];
  const open = contractCase?.status === "awaiting_review";

  return (
    <div>
      {contractCase?.consensus?.finalRecommendation && (
        <div className="bg-white border border-rule rounded p-5 mb-6">
          <h3 className="text-lg mb-2">What the review found</h3>
          <p className="text-sm">{contractCase.consensus.finalRecommendation}</p>
        </div>
      )}

      {open ? (
        <div className="bg-white border border-rule rounded p-5 mb-6">
          <label className="block text-xs font-medium mb-1">Comment</label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border border-rule rounded px-3 py-2 mb-4 text-sm"
          />
          {error && <p className="text-sm text-severity-critical mb-3">{error}</p>}
          <div className="flex gap-3">
            {ACTIONS.map((a) => (
              <button
                key={a.decision}
                onClick={() => submit.mutate(a.decision)}
                disabled={submit.isPending}
                className="px-4 py-2 rounded text-sm font-medium border border-ink disabled:opacity-40"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink/60 mb-6">
          This case is {contractCase?.status?.replace(/_/g, " ")}. No decision is open.
        </p>
      )}

      {decisions.length > 0 && (
        <>
          <h3 className="text-lg mb-3">Decisions</h3>
          {decisions.map((d, i) => (
            <div key={i} className="border-b border-rule/60 py-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{d.decision.replace(/_/g, " ")}</span>
                <span className="text-xs text-ink/50">{new Date(d.at).toLocaleString()}</span>
              </div>
              <div className="text-xs text-ink/50">{(d.roles ?? []).join(", ")}</div>
              {d.comment && <p className="mt-1">{d.comment}</p>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
