import { useMemo, useState } from "react";
import { downloadBlob } from "../../api/client";
import Button from "../ui/Button";
import { TabRow } from "../ui/Inputs";
import { SeverityTag } from "../ui/Tags";
import { EmptyState, Eyebrow, SectionHeading } from "../ui/Primitives";
import { PipelineChecklist } from "../StageRail";
import { anchorId, buildClauseIndex, normalizeRef, scrollToClause } from "../../lib/clause";
import { SEVERITY_BAR, SEVERITY_WEIGHT, titleCase } from "../../lib/format";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/**
 * Document on the left, everything the agents found on the right.
 * Findings link back to the clause they cite; when the reference doesn't
 * resolve against the parsed document the finding still shows, it just
 * isn't clickable.
 */
export default function ContractViewer({ contractCase, status, caseId }) {
  const [kind, setKind] = useState("all");
  const clauses = contractCase?.document?.structuredContract?.clauses ?? [];
  const hasComparison = Boolean(contractCase?.document?.comparisonFileRef);
  const clauseIndex = useMemo(() => buildClauseIndex(clauses), [clauses]);

  const findings = useMemo(() => {
    const risk = (contractCase?.risk?.findings ?? []).map((f) => ({
      kind: "risk",
      severity: f.severity,
      title: titleCase(f.riskType),
      body: f.rationale,
      ref: f.clause_ref,
    }));

    const compliance = (contractCase?.compliance?.findings ?? [])
      .filter((f) => f.result !== "pass")
      .map((f) => ({
        kind: "compliance",
        severity: f.result === "fail" ? "high" : "medium",
        title: f.framework,
        body: f.detail || f.citation,
        ref: f.clause_ref,
      }));

    const rewrites = (contractCase?.recommendations?.clauseRewrites ?? []).map((r) => ({
      kind: "guidance",
      severity: "info",
      title: "Suggested rewrite",
      body: r.reason,
      ref: r.clause_ref,
    }));

    return [...risk, ...compliance, ...rewrites].sort(
      (a, b) => (SEVERITY_WEIGHT[b.severity] ?? 0) - (SEVERITY_WEIGHT[a.severity] ?? 0)
    );
  }, [contractCase]);

  const passes = (contractCase?.compliance?.findings ?? []).filter((f) => f.result === "pass");
  const shown = kind === "all" ? findings : findings.filter((f) => f.kind === kind);

  if (clauses.length === 0)
    return (
      <div>
        <SectionHeading title="Contract" meta="Parsing in progress" />
        <p className="mt-5 max-w-lg text-sm text-muted">
          The document text appears here once ingestion and clause extraction finish.
        </p>
        <PipelineChecklist className="mt-8" status={status} caseStatus={contractCase?.status} />
      </div>
    );

  return (
    <div>
      <SectionHeading
        title="Contract"
        meta={`${clauses.length} clauses · ${findings.length} findings`}
        actions={
          <>
            <Button size="sm" onClick={() => downloadBlob(`/contracts/${caseId}/file?kind=original`)}>
              Download original
            </Button>
            {hasComparison && (
              <Button
                size="sm"
                onClick={() => downloadBlob(`/contracts/${caseId}/file?kind=comparison`)}
              >
                Download comparison
              </Button>
            )}
          </>
        }
      />

      <div className="mt-6 grid gap-8 xl:grid-cols-[1fr_360px]">
        {/* Document */}
        <article className="max-h-[72vh] overflow-y-auto border border-rule bg-surface px-8 py-8 leading-relaxed">
          {clauses.map((clause) => (
            <section
              key={clause.id}
              id={anchorId(clause.sectionRef ?? clause.id)}
              className="mb-8 scroll-mt-8 px-2 py-1"
            >
              <div className="label">{clause.sectionRef ?? clause.id}</div>
              {clause.heading && (
                <h3 className="mt-1 font-display text-base text-ink">{clause.heading}</h3>
              )}
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{clause.text}</p>
            </section>
          ))}
        </article>

        {/* Intelligence */}
        <aside className="min-w-0">
          <Eyebrow>Intelligence</Eyebrow>

          <TabRow
            className="mt-2"
            value={kind}
            onChange={setKind}
            options={[
              { value: "all", label: "All", count: findings.length },
              { value: "risk", label: "Risk", count: findings.filter((f) => f.kind === "risk").length },
              {
                value: "compliance",
                label: "Compliance",
                count: findings.filter((f) => f.kind === "compliance").length,
              },
              {
                value: "guidance",
                label: "Guidance",
                count: findings.filter((f) => f.kind === "guidance").length,
              },
            ]}
          />

          {passes.length > 0 && (
            <p className="mt-4 border-l border-severity-low py-1 pl-3 text-xs text-muted">
              <span className="text-severity-low">{passes.length} compliance checks passed</span>{" "}
              against {(contractCase?.compliance?.frameworksChecked ?? []).join(", ") || "the recorded frameworks"}.
            </p>
          )}

          <div className="mt-4 max-h-[62vh] space-y-px overflow-y-auto">
            {shown.length === 0 ? (
              <p className="border border-dashed border-rule px-4 py-8 text-center text-xs text-faint">
                Nothing recorded in this category.
              </p>
            ) : (
              shown.map((f, i) => {
                const linked = clauseIndex.has(normalizeRef(f.ref));
                return (
                  <div key={i} className="relative border border-rule bg-surface p-4">
                    <span
                      aria-hidden
                      className={cx("absolute inset-y-0 left-0 w-0.5", SEVERITY_BAR[f.severity])}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <SeverityTag severity={f.severity} />
                      {linked ? (
                        <button
                          onClick={() => scrollToClause(f.ref)}
                          className="shrink-0 font-mono text-2xs text-severity-info underline decoration-severity-info/40 underline-offset-2 cursor-pointer"
                        >
                          {f.ref}
                        </button>
                      ) : (
                        <span
                          className="shrink-0 font-mono text-2xs text-faint"
                          title="No matching clause in the parsed document"
                        >
                          {f.ref}
                        </span>
                      )}
                    </div>
                    <h4 className="mt-2 text-sm text-ink">{f.title}</h4>
                    {f.body && <p className="mt-1.5 text-xs leading-relaxed text-muted">{f.body}</p>}
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
