export default function Explainability({ contractCase }) {
  const justifications = contractCase?.explainability?.justifications ?? [];
  const consensus = contractCase?.consensus ?? {};

  if (justifications.length === 0)
    return <p className="text-sm text-ink/60">Explanations are produced at Stage 6.</p>;

  return (
    <div>
      {consensus.finalRecommendation && (
        <div className="bg-white border border-rule rounded p-5 mb-6">
          <h3 className="text-lg mb-2">Final recommendation</h3>
          <p className="text-sm">{consensus.finalRecommendation}</p>
          {consensus.escalationReasons?.length > 0 && (
            <ul className="text-xs text-ink/60 mt-3 list-disc pl-4">
              {consensus.escalationReasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </div>
      )}

      {justifications.map((j, i) => (
        <div key={i} className="bg-white border border-rule rounded p-5 mb-3">
          <div className="flex justify-between mb-2">
            <h4 className="font-medium">{j.decision}</h4>
            <span className="text-xs text-ink/50">
              {Math.round((j.confidence ?? 0) * 100)}% confidence
            </span>
          </div>
          <p className="text-sm mb-3">{j.legalRationale}</p>
          <div className="text-xs text-ink/60 space-y-1">
            <div>Clauses: {(j.clauseReferences ?? []).join(", ") || "—"}</div>
            <div>Regulations: {(j.regulationsConsulted ?? []).join(", ") || "—"}</div>
            <div>Evidence: {(j.evidenceCitations ?? []).join("; ") || "—"}</div>
            <div>Agents: {(j.contributingAgents ?? []).join(", ") || "—"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
