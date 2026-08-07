import { Eyebrow, NotYet, SectionHeading } from "../ui/Primitives";
import { SEVERITY_BAR, titleCase } from "../../lib/format";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const PRIORITY_TONE = { high: SEVERITY_BAR.high, medium: SEVERITY_BAR.medium, low: SEVERITY_BAR.low };
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export default function NegotiationStrategy({ contractCase }) {
  const points = contractCase?.negotiationStrategy?.points ?? [];

  if (points.length === 0)
    return (
      <div>
        <SectionHeading title="Negotiation" />
        <NotYet stage={4}>
          The negotiation agent sets an opening position, a fallback and a walk-away
          point for each contested topic.
        </NotYet>
      </div>
    );

  const ordered = [...points].sort(
    (a, b) => (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3)
  );

  return (
    <div>
      <SectionHeading title="Negotiation" meta={`${points.length} positions`} />

      <div className="mt-2 divide-y divide-rule border-b border-rule">
        {ordered.map((p, i) => (
          <div key={i} className="relative py-5 pl-4">
            <span
              aria-hidden
              className={cx("absolute inset-y-0 left-0 w-0.5", PRIORITY_TONE[p.priority] ?? "bg-rule")}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h4 className="font-display text-base text-ink">{titleCase(p.topic)}</h4>
              <Eyebrow>{titleCase(p.priority)} priority</Eyebrow>
            </div>

            <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-3">
              <div className="border-l border-severity-low/50 pl-3">
                <Eyebrow>Open with</Eyebrow>
                <dd className="mt-1.5 text-sm text-ink">{p.openingPosition}</dd>
              </div>
              <div className="border-l border-severity-medium/50 pl-3">
                <Eyebrow>Fall back to</Eyebrow>
                <dd className="mt-1.5 text-sm text-ink">{p.fallbackPosition}</dd>
              </div>
              {p.walkAwayPosition && (
                <div className="border-l border-severity-critical/50 pl-3">
                  <Eyebrow>Walk away at</Eyebrow>
                  <dd className="mt-1.5 text-sm text-ink">{p.walkAwayPosition}</dd>
                </div>
              )}
            </dl>

            <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted">{p.rationale}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
