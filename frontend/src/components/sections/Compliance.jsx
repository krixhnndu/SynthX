import DataTable from "../ui/DataTable";
import { ResultTag } from "../ui/Tags";
import { Eyebrow, NotYet, SectionHeading } from "../ui/Primitives";

const RESULT_BAR = {
  pass: "bg-severity-low",
  fail: "bg-severity-critical",
  uncertain: "bg-severity-medium",
};

export default function Compliance({ contractCase }) {
  const findings = contractCase?.compliance?.findings ?? [];
  const frameworks = contractCase?.compliance?.frameworksChecked ?? [];

  if (findings.length === 0)
    return (
      <div>
        <SectionHeading title="Compliance" />
        <NotYet stage={3}>
          Compliance verification checks each clause against the frameworks held in the
          knowledge base and cites the provision it relied on.
        </NotYet>
      </div>
    );

  const tally = ["fail", "uncertain", "pass"].map((r) => ({
    result: r,
    count: findings.filter((f) => f.result === r).length,
  }));

  return (
    <div>
      <SectionHeading title="Compliance" meta={`${findings.length} checks`} />

      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-y border-rule py-5">
        {tally.map((t) => (
          <div key={t.result}>
            <div className="font-display text-2xl leading-none text-ink">{t.count}</div>
            <Eyebrow className="mt-1.5">{t.result}</Eyebrow>
          </div>
        ))}
        <div className="min-w-0 flex-1">
          <Eyebrow>Frameworks checked</Eyebrow>
          <p className="mt-1.5 font-mono text-2xs text-muted">
            {frameworks.join(" · ") || "none recorded"}
          </p>
        </div>
      </div>

      <DataTable
        className="mt-8"
        rows={findings}
        rowKey={(_, i) => i}
        tone={(f) => RESULT_BAR[f.result]}
        columns={[
          {
            key: "clause_ref",
            header: "Clause",
            render: (f) => <span className="font-mono text-2xs text-faint">{f.clause_ref}</span>,
          },
          {
            key: "framework",
            header: "Framework",
            render: (f) => <span className="text-sm text-ink">{f.framework}</span>,
          },
          { key: "result", header: "Result", render: (f) => <ResultTag result={f.result} /> },
          {
            key: "citation",
            header: "Basis",
            width: "50%",
            render: (f) => (
              <span className="block">
                <span className="block text-xs text-muted">{f.citation}</span>
                {f.detail && <span className="mt-1 block text-xs text-faint">{f.detail}</span>}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
