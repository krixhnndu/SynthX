import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";

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

  if (isLoading) return <p className="text-sm text-ink/60">Loading version history.</p>;

  if (versions.length === 0)
    return (
      <p className="text-sm text-ink/60 border border-dashed border-rule rounded p-8">
        No version history yet. A snapshot is captured as the pipeline writes each stage
        and when a review decision is made.
      </p>
    );

  const payload = snapshot?.payload ?? {};

  return (
    <div className="grid grid-cols-[220px_1fr] gap-6">
      <div className="text-sm">
        {versions.map((v) => (
          <button
            key={v.version}
            onClick={() => setSelected(v.version)}
            className={`block w-full text-left px-3 py-2 rounded mb-0.5 ${
              selected === v.version ? "bg-ink text-paper" : "hover:bg-white"
            }`}
          >
            <div className="font-medium">v{v.version}</div>
            <div className={`text-xs ${selected === v.version ? "text-paper/60" : "text-ink/50"}`}>
              {new Date(v.createdAt).toLocaleString()}
            </div>
          </button>
        ))}
      </div>

      <div>
        {selected == null ? (
          <p className="text-sm text-ink/60">Select a version to inspect its snapshot.</p>
        ) : (
          <div className="bg-white border border-rule rounded p-5">
            <div className="flex gap-8 text-sm mb-4">
              <Field label="Created by" value={snapshot?.createdBy ?? "—"} />
              <Field label="Status" value={payload?.status ?? "—"} />
              <Field label="Risk score" value={payload?.risk?.riskScore ?? "—"} />
              <Field
                label="Clauses"
                value={payload?.document?.structuredContract?.clauses?.length ?? 0}
              />
            </div>
            <pre className="text-xs bg-paper border border-rule rounded p-4 overflow-auto max-h-96">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-ink/50">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
