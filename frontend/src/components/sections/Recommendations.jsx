import { useState } from "react";
import Button from "../ui/Button";
import { Eyebrow, NotYet, SectionHeading } from "../ui/Primitives";
import { SEVERITY_BAR, titleCase } from "../../lib/format";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const PRIORITY_TONE = {
  high: SEVERITY_BAR.high,
  medium: SEVERITY_BAR.medium,
  low: SEVERITY_BAR.low,
};

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export default function Recommendations({ contractCase }) {
  const rewrites = contractCase?.recommendations?.clauseRewrites ?? [];
  // Local triage only — there is no endpoint to persist an accept or reject.
  const [choices, setChoices] = useState({});

  if (rewrites.length === 0)
    return (
      <div>
        <SectionHeading title="Recommendations" />
        <NotYet stage={4}>
          The recommendation agent drafts replacement wording for the clauses that
          carry the most exposure.
        </NotYet>
      </div>
    );

  const ordered = [...rewrites].sort(
    (a, b) => (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3)
  );

  return (
    <div>
      <SectionHeading
        title="Recommendations"
        meta={`${rewrites.length} proposed rewrites · marks are kept on this screen only`}
      />

      <div className="mt-2 divide-y divide-rule border-b border-rule">
        {ordered.map((r, i) => (
          <div key={i} className="relative py-5 pl-4">
            <span
              aria-hidden
              className={cx("absolute inset-y-0 left-0 w-0.5", PRIORITY_TONE[r.priority] ?? "bg-rule")}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <Eyebrow>{titleCase(r.priority)} priority</Eyebrow>
              <span className="font-mono text-2xs text-faint">{r.clause_ref}</span>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="border-l border-rule pl-4">
                <Eyebrow>Current</Eyebrow>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-faint line-through">
                  {r.currentText}
                </p>
              </div>
              <div className="border-l border-ruleHi pl-4">
                <Eyebrow>Proposed</Eyebrow>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                  {r.proposedText}
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted">{r.reason}</p>

            <div className="mt-4 flex gap-2">
              {["accept", "reject"].map((choice) => (
                <Button
                  key={choice}
                  size="sm"
                  variant={choices[i] === choice ? "primary" : "secondary"}
                  onClick={() =>
                    setChoices((prev) => ({ ...prev, [i]: prev[i] === choice ? undefined : choice }))
                  }
                >
                  {choice === "accept" ? "Mark accepted" : "Mark rejected"}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
