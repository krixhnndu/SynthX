export default function NegotiationStrategy({ contractCase }) {
  const points = contractCase?.negotiationStrategy?.points ?? [];
  if (points.length === 0)
    return <p className="text-sm text-ink/60">Negotiation strategy is drafted at Stage 4.</p>;

  const ordered = [...points].sort(
    (a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority])
  );

  return (
    <div>
      {ordered.map((p, i) => (
        <div key={i} className="bg-white border border-rule rounded p-5 mb-3">
          <div className="flex justify-between mb-3">
            <h4 className="font-medium">{p.topic.replace(/_/g, " ")}</h4>
            <span className="text-xs uppercase tracking-wide text-ink/50">{p.priority}</span>
          </div>
          <dl className="text-sm space-y-2">
            <div><dt className="text-xs uppercase text-ink/50">Open with</dt><dd>{p.openingPosition}</dd></div>
            <div><dt className="text-xs uppercase text-ink/50">Fall back to</dt><dd>{p.fallbackPosition}</dd></div>
            {p.walkAwayPosition && (
              <div><dt className="text-xs uppercase text-ink/50">Walk away at</dt><dd>{p.walkAwayPosition}</dd></div>
            )}
          </dl>
          <p className="text-xs text-ink/60 mt-3">{p.rationale}</p>
        </div>
      ))}
    </div>
  );
}
