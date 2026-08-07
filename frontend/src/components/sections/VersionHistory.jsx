import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { EmptyState, Eyebrow, Field, SectionHeading, Skeleton } from "../ui/Primitives";
import { formatDateTime } from "../../lib/format";

const cx = (...parts) => parts.filter(Boolean).join(" ");

export default function VersionHistory({ caseId }) {
  const [selected, setSelected] = useState(null);

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["versions", caseId],
    queryFn: async () => (await api.get(`/contracts/${caseId}/versions`)).data,
  });

  const { data: snapshot } = useQuery({
    queryKey: ["version", caseId, selected],
    queryFn: async () => (await api.get(`/contracts/${caseId}/versions/${selected}`)).data,
    enabled: selected != null,
  });

  if (isLoading)
    return (
      <div>
        <SectionHeading title="Version history" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );

  if (versions.length === 0)
    return (
      <div>
        <SectionHeading title="Version history" />
        <EmptyState className="mt-6" title="No snapshots yet">
          A snapshot is captured as the pipeline writes each stage and when a review
          decision is made.
        </EmptyState>
      </div>
    );

  const payload = snapshot?.payload ?? {};

  return (
    <div>
      <SectionHeading title="Version history" meta={`${versions.length} snapshots`} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[200px_1fr]">
        <div>
          {versions.map((v) => {
            const on = selected === v.version;
            return (
              <button
                key={v.version}
                onClick={() => setSelected(v.version)}
                aria-current={on ? "true" : undefined}
                className={cx(
                  "block w-full border-l py-2 pl-3 text-left transition-colors",
                  on ? "border-ink" : "border-rule hover:border-ruleHi"
                )}
              >
                <span className={cx("block font-mono text-xs", on ? "text-ink" : "text-muted")}>
                  v{v.version}
                </span>
                <span className="mt-0.5 block font-mono text-2xs text-faint">
                  {formatDateTime(v.createdAt)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="min-w-0">
          {selected == null ? (
            <p className="border-l border-rule py-1 pl-4 text-sm text-muted">
              Select a snapshot to inspect the case as it stood at that point.
            </p>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-6 border-y border-rule py-4 sm:grid-cols-4">
                <Field label="Created by" value={snapshot?.createdBy ?? "—"} />
                <Field label="Status" value={payload?.status ?? "—"} />
                <Field label="Risk score" value={payload?.risk?.riskScore ?? "—"} mono />
                <Field
                  label="Clauses"
                  value={payload?.document?.structuredContract?.clauses?.length ?? 0}
                  mono
                />
              </div>

              <Eyebrow className="mt-6">Raw snapshot</Eyebrow>
              <pre className="mt-2 max-h-96 overflow-auto border border-rule bg-surface p-4 font-mono text-2xs leading-relaxed text-muted">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
