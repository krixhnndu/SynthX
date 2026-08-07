import { useState } from "react";
import { TabRow } from "../ui/Inputs";
import DataTable from "../ui/DataTable";
import { Confidence } from "../ui/Tags";
import { Eyebrow, NotYet, SectionHeading } from "../ui/Primitives";
import { titleCase } from "../../lib/format";

export default function ClauseExplorer({ contractCase }) {
  const [type, setType] = useState("all");
  const clauses = contractCase?.clauseClassification?.clauses ?? [];
  const obligations = contractCase?.clauseClassification?.obligations ?? [];

  if (clauses.length === 0)
    return (
      <div>
        <SectionHeading title="Clauses" />
        <NotYet stage={2}>
          Clause classification labels each section and extracts the obligations each
          party takes on.
        </NotYet>
      </div>
    );

  const types = ["all", ...new Set(clauses.map((c) => c.clauseType))];
  const shown = type === "all" ? clauses : clauses.filter((c) => c.clauseType === type);

  return (
    <div>
      <SectionHeading title="Clauses" meta={`${clauses.length} classified`} />

      <TabRow
        className="mt-5"
        value={type}
        onChange={setType}
        options={types.map((t) => ({
          value: t,
          label: t === "all" ? "All" : titleCase(t),
          count: t === "all" ? clauses.length : clauses.filter((c) => c.clauseType === t).length,
        }))}
      />

      <div className="mt-6 divide-y divide-rule border-y border-rule">
        {shown.map((clause) => (
          <details key={clause.id} className="group py-4">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
              <span className="min-w-0">
                <span className="label">{titleCase(clause.clauseType)}</span>
                <span className="mt-1 block text-sm text-ink">{clause.summary}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-mono text-2xs text-faint">{clause.id}</span>
                <Confidence value={clause.confidence} />
              </span>
            </summary>
            <p className="mt-3 whitespace-pre-wrap border-l border-rule pl-4 text-sm leading-relaxed text-muted">
              {clause.text}
            </p>
          </details>
        ))}
      </div>

      {obligations.length > 0 && (
        <div className="mt-12">
          <SectionHeading title="Obligations" meta={`${obligations.length} recorded`} />
          <DataTable
            className="mt-2"
            rows={obligations}
            rowKey={(_, i) => i}
            columns={[
              { key: "party", header: "Party", render: (o) => <span className="text-sm text-ink">{o.party}</span> },
              { key: "obligation", header: "Obligation", width: "50%", render: (o) => <span className="text-sm text-muted">{o.obligation}</span> },
              { key: "clause_ref", header: "Clause", render: (o) => <span className="font-mono text-2xs text-faint">{o.clause_ref}</span> },
              { key: "dueBy", header: "Due", align: "right", render: (o) => <span className="font-mono text-2xs text-faint">{o.dueBy ?? "—"}</span> },
            ]}
          />
        </div>
      )}
    </div>
  );
}
