import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import Button from "../ui/Button";
import { Label, TextArea } from "../ui/Inputs";
import { StatusTag } from "../ui/Tags";
import { ErrorNote, Eyebrow, Panel, SectionHeading } from "../ui/Primitives";
import { STATUS_LABEL, formatDateTime } from "../../lib/format";

const ACTIONS = [
  { decision: "approve", label: "Approve", variant: "primary" },
  { decision: "request_changes", label: "Request changes", variant: "secondary" },
  { decision: "reject", label: "Reject", variant: "danger" },
];

const DECISION_TONE = {
  approve: "bg-severity-low",
  request_changes: "bg-severity-high",
  reject: "bg-severity-critical",
};

const DECISION_LABEL = {
  approve: "Approved",
  request_changes: "Requested changes",
  reject: "Rejected",
};

export default function ReviewApproval({ contractCase, caseId }) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: (decision) => api.post(`/contracts/${caseId}/review`, { decision, comment }),
    onSuccess: () => {
      setComment("");
      setError(null);
      setConfirming(null);
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    },
    onError: (err) => {
      setConfirming(null);
      setError(
        err.response?.status === 403
          ? "Your role can't make that decision on a case at this risk level."
          : err.response?.data?.detail ?? "The decision couldn't be recorded."
      );
    },
  });

  const decisions = contractCase?.review?.decisions ?? [];
  const open = contractCase?.status === "awaiting_review";

  return (
    <div>
      <SectionHeading
        title="Review & approval"
        meta="One human decision closes the case"
        actions={<StatusTag status={contractCase?.status} />}
      />

      {contractCase?.consensus?.finalRecommendation && (
        <Panel className="mt-6" tone="bg-severity-info">
          <Eyebrow>What the review found</Eyebrow>
          <p className="mt-2 max-w-3xl font-display text-lg leading-snug text-ink">
            {contractCase.consensus.finalRecommendation}
          </p>
        </Panel>
      )}

      {open ? (
        <div className="mt-10 max-w-2xl">
          <Eyebrow>Record your decision</Eyebrow>

          <div className="mt-3">
            <Label htmlFor="review-comment" hint="attached to the audit trail">
              Comment
            </Label>
            <TextArea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Why you are deciding this way."
            />
          </div>

          {error && <ErrorNote className="mt-4">{error}</ErrorNote>}

          {confirming ? (
            <div className="mt-5 border border-ruleHi bg-surface p-4">
              <p className="text-sm text-ink">
                {DECISION_LABEL[confirming]} — this is written to the audit trail and
                cannot be withdrawn.
              </p>
              <div className="mt-4 flex gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => submit.mutate(confirming)}
                  disabled={submit.isPending}
                >
                  {submit.isPending ? "Recording" : "Confirm"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>
                  Go back
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap gap-3">
              {ACTIONS.map((a) => (
                <Button
                  key={a.decision}
                  variant={a.variant}
                  onClick={() => setConfirming(a.decision)}
                  disabled={submit.isPending}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-8 max-w-lg border-l border-rule py-1 pl-4 text-sm text-muted">
          This case is {(STATUS_LABEL[contractCase?.status] ?? contractCase?.status ?? "not ready").toLowerCase()}.
          No decision is open.
        </p>
      )}

      {decisions.length > 0 && (
        <div className="mt-12">
          <SectionHeading title="Decision history" meta={`${decisions.length} recorded`} />
          <div className="mt-2 divide-y divide-rule border-b border-rule">
            {decisions.map((d, i) => (
              <div key={i} className="relative py-4 pl-4">
                <span
                  aria-hidden
                  className={`absolute inset-y-0 left-0 w-0.5 ${DECISION_TONE[d.decision] ?? "bg-rule"}`}
                />
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="text-sm text-ink">
                    {DECISION_LABEL[d.decision] ?? d.decision}
                  </span>
                  <span className="font-mono text-2xs text-faint">{formatDateTime(d.at)}</span>
                </div>
                <div className="mt-1 font-mono text-2xs text-faint">
                  {(d.roles ?? []).join(" · ") || "role not recorded"}
                </div>
                {d.comment && <p className="mt-2 text-sm text-muted">{d.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
