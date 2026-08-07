import { Confidence } from "../ui/Tags";
import { Eyebrow, NotYet, Panel, SectionHeading } from "../ui/Primitives";

export default function Explainability({ contractCase }) {
  const justifications = contractCase?.explainability?.justifications ?? [];
  const consensus = contractCase?.consensus ?? {};

  if (justifications.length === 0)
    return (
      <div>
        <SectionHeading title="Explainability" />
        <NotYet stage={6}>
          Every decision the agents reached is restated here with the clauses,
          regulations and evidence it rested on.
        </NotYet>
      </div>
    );

  return (
    <div>
      <SectionHeading title="Explainability" meta={`${justifications.length} recorded decisions`} />

      {consensus.finalRecommendation && (
        <Panel className="mt-6" tone="bg-severity-info">
          <Eyebrow>Final recommendation</Eyebrow>
          <p className="mt-2 max-w-3xl font-display text-lg leading-snug text-ink">
            {consensus.finalRecommendation}
          </p>
          {consensus.escalationReasons?.length > 0 && (
            <>
              <Eyebrow className="mt-5">Escalated because</Eyebrow>
              <ul className="mt-2 space-y-1">
                {consensus.escalationReasons.map((r, i) => (
                  <li key={i} className="border-l border-rule pl-3 text-xs text-muted">
                    {r}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      )}

      <div className="mt-10 divide-y divide-rule border-y border-rule">
        {justifications.map((j, i) => (
          <div key={i} className="py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h4 className="font-display text-base text-ink">{j.decision}</h4>
              <Confidence value={j.confidence} />
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{j.legalRationale}</p>

            <dl className="mt-4 grid gap-x-10 gap-y-3 sm:grid-cols-2">
              <Cited label="Clauses" values={j.clauseReferences} />
              <Cited label="Regulations" values={j.regulationsConsulted} />
              <Cited label="Evidence" values={j.evidenceCitations} />
              <Cited label="Contributing agents" values={j.contributingAgents} />
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cited({ label, values }) {
  return (
    <div className="min-w-0">
      <Eyebrow>{label}</Eyebrow>
      <dd className="mt-1 font-mono text-2xs leading-relaxed text-muted">
        {values?.length ? values.join(" · ") : "—"}
      </dd>
    </div>
  );
}
