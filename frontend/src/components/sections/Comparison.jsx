export default function Comparison({ contractCase }) {
  const comparison = contractCase?.comparison ?? {};
  if (comparison.skipped)
    return (
      <p className="text-sm text-ink/60">
        No prior version was supplied, so nothing was compared.
      </p>
    );

  const groups = [
    ["Added", comparison.added ?? []],
    ["Deleted", comparison.deleted ?? []],
    ["Modified", comparison.modified ?? []],
  ];

  return (
    <div>
      {groups.map(([label, items]) => (
        <section key={label} className="mb-8">
          <h3 className="text-lg mb-3">{label} ({items.length})</h3>
          {items.length === 0 && <p className="text-sm text-ink/50">None.</p>}
          {items.map((item, i) => (
            <div key={i} className="bg-white border border-rule rounded p-4 mb-2 text-sm">
              <div className="font-mono text-xs text-ink/50 mb-2">{item.clause_ref}</div>
              {item.before !== undefined ? (
                <>
                  <p className="line-through text-ink/50 mb-1">{item.before}</p>
                  <p className="mb-2">{item.after}</p>
                  <p className="text-xs text-ink/60">{item.effect}</p>
                </>
              ) : (
                <>
                  <p className="mb-2 whitespace-pre-wrap">{item.text}</p>
                  <p className="text-xs text-ink/60">{item.significance}</p>
                </>
              )}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
