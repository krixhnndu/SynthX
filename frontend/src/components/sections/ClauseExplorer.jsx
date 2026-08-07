import { useState } from "react";

export default function ClauseExplorer({ contractCase }) {
  const [type, setType] = useState("all");
  const clauses = contractCase?.clauseClassification?.clauses ?? [];
  const obligations = contractCase?.clauseClassification?.obligations ?? [];
  const types = ["all", ...new Set(clauses.map((c) => c.clauseType))];

  if (clauses.length === 0)
    return <p className="text-sm text-ink/60">Clause classification runs at Stage 2.</p>;

  const shown = type === "all" ? clauses : clauses.filter((c) => c.clauseType === type);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5 text-xs">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-2.5 py-1 rounded border ${
              type === t ? "bg-ink text-paper border-ink" : "border-rule"
            }`}
          >
            {t.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {shown.map((clause) => (
        <div key={clause.id} className="bg-white border border-rule rounded p-4 mb-3">
          <div className="flex justify-between text-xs text-ink/50 mb-2">
            <span className="font-mono">{clause.id}</span>
            <span>{Math.round((clause.confidence ?? 0) * 100)}% confidence</span>
          </div>
          <div className="text-xs uppercase tracking-wide mb-1">
            {clause.clauseType?.replace(/_/g, " ")}
          </div>
          <p className="text-sm mb-2">{clause.summary}</p>
          <details className="text-sm">
            <summary className="cursor-pointer text-ink/60">Full text</summary>
            <p className="mt-2 whitespace-pre-wrap">{clause.text}</p>
          </details>
        </div>
      ))}

      {obligations.length > 0 && (
        <>
          <h3 className="text-lg mt-8 mb-3">Obligations</h3>
          <table className="w-full text-sm bg-white border border-rule rounded">
            <thead className="text-left text-xs uppercase text-ink/50">
              <tr className="border-b border-rule">
                <th className="p-2">Party</th><th>Obligation</th><th>Clause</th><th>Due</th>
              </tr>
            </thead>
            <tbody>
              {obligations.map((o, i) => (
                <tr key={i} className="border-b border-rule/50">
                  <td className="p-2">{o.party}</td>
                  <td>{o.obligation}</td>
                  <td className="font-mono text-xs">{o.clause_ref}</td>
                  <td>{o.dueBy ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
