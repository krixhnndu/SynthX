import { Eyebrow, NotYet, SectionHeading } from "../ui/Primitives";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const GROUP_TONE = {
  Added: "bg-severity-low",
  Deleted: "bg-severity-critical",
  Modified: "bg-severity-medium",
};

export default function Comparison({ contractCase }) {
  const comparison = contractCase?.comparison ?? {};

  if (comparison.skipped)
    return (
      <div>
        <SectionHeading title="Comparison" />
        <p className="mt-5 max-w-lg text-sm text-muted">
          No prior version was supplied with this contract, so nothing was compared.
          Upload a prior version alongside a contract to enable this.
        </p>
      </div>
    );

  const groups = [
    ["Added", comparison.added ?? []],
    ["Deleted", comparison.deleted ?? []],
    ["Modified", comparison.modified ?? []],
  ];

  const total = groups.reduce((n, [, items]) => n + items.length, 0);

  if (total === 0)
    return (
      <div>
        <SectionHeading title="Comparison" />
        <NotYet stage={3}>
          Cross-document comparison lists what was added, removed and reworded against
          the prior version.
        </NotYet>
      </div>
    );

  return (
    <div>
      <SectionHeading title="Comparison" meta={`${total} changes against the prior version`} />

      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-y border-rule py-5">
        {groups.map(([label, items]) => (
          <div key={label}>
            <div className="font-display text-2xl leading-none text-ink">{items.length}</div>
            <Eyebrow className="mt-1.5">{label}</Eyebrow>
          </div>
        ))}
      </div>

      {groups.map(([label, items]) =>
        items.length === 0 ? null : (
          <section key={label} className="mt-10">
            <Eyebrow>{label}</Eyebrow>
            <div className="mt-3 divide-y divide-rule border-y border-rule">
              {items.map((item, i) => (
                <div key={i} className="relative py-4 pl-4">
                  <span aria-hidden className={cx("absolute inset-y-0 left-0 w-0.5", GROUP_TONE[label])} />
                  <div className="font-mono text-2xs text-faint">{item.clause_ref}</div>
                  {item.before !== undefined ? (
                    <>
                      <p className="mt-2 text-sm text-faint line-through">{item.before}</p>
                      <p className="mt-1 text-sm text-ink">{item.after}</p>
                      <p className="mt-2 text-xs text-muted">{item.effect}</p>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{item.text}</p>
                      <p className="mt-2 text-xs text-muted">{item.significance}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        )
      )}
    </div>
  );
}
