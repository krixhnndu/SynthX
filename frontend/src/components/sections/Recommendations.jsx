import { useState } from "react";

export default function Recommendations({ contractCase }) {
  const rewrites = contractCase?.recommendations?.clauseRewrites ?? [];
  const [choices, setChoices] = useState({});

  if (rewrites.length === 0)
    return <p className="text-sm text-ink/60">Recommendations are drafted at Stage 4.</p>;

  return (
    <div>
      {rewrites.map((r, i) => (
        <div key={i} className="bg-white border border-rule rounded p-5 mb-4">
          <div className="flex justify-between text-xs text-ink/50 mb-3">
            <span className="font-mono">{r.clause_ref}</span>
            <span className="uppercase tracking-wide">{r.priority} priority</span>
          </div>

          <p className="text-sm text-ink/50 line-through mb-2 whitespace-pre-wrap">
            {r.currentText}
          </p>
          <p className="text-sm mb-3 whitespace-pre-wrap">{r.proposedText}</p>
          <p className="text-xs text-ink/60 mb-4">{r.reason}</p>

          <div className="flex gap-2">
            {["accept", "reject"].map((choice) => (
              <button
                key={choice}
                onClick={() => setChoices({ ...choices, [i]: choice })}
                className={`px-3 py-1 text-sm rounded border ${
                  choices[i] === choice ? "bg-ink text-paper border-ink" : "border-rule"
                }`}
              >
                {choice === "accept" ? "Accept" : "Reject"}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
