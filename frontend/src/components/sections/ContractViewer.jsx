import { downloadBlob } from "../../api/client";

export default function ContractViewer({ contractCase, caseId }) {
  const clauses = contractCase?.document?.structuredContract?.clauses ?? [];
  const hasComparison = Boolean(contractCase?.document?.comparisonFileRef);

  if (clauses.length === 0)
    return <Empty>The contract is still being parsed. This view fills in at Stage 1.</Empty>;

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => downloadBlob(`/contracts/${caseId}/file?kind=original`)}
          className="px-4 py-2 rounded text-sm font-medium border border-ink"
        >
          Download original
        </button>
        {hasComparison && (
          <button
            onClick={() => downloadBlob(`/contracts/${caseId}/file?kind=comparison`)}
            className="px-4 py-2 rounded text-sm font-medium border border-ink"
          >
            Download comparison
          </button>
        )}
      </div>

      <article className="bg-white border border-rule rounded p-8 max-w-3xl leading-relaxed">
        {clauses.map((clause) => (
          <section key={clause.id} className="mb-6">
            <h3 className="text-sm font-mono text-ink/50 mb-1">{clause.sectionRef ?? clause.id}</h3>
            {clause.heading && <h2 className="text-lg mb-2">{clause.heading}</h2>}
            <p className="whitespace-pre-wrap">{clause.text}</p>
          </section>
        ))}
      </article>
    </div>
  );
}

function Empty({ children }) {
  return <p className="text-sm text-ink/60 border border-dashed border-rule rounded p-8">{children}</p>;
}
