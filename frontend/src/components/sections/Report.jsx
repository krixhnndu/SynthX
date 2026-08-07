import { useQuery } from "@tanstack/react-query";
import { api, downloadBlob } from "../../api/client";

export default function Report({ caseId }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["report", caseId],
    queryFn: async () => (await api.get(`/contracts/${caseId}/report`)).data,
  });

  if (isLoading) return <p className="text-sm text-ink/60">Loading report.</p>;

  if (error?.response?.status === 409)
    return (
      <p className="text-sm text-ink/60 border border-dashed border-rule rounded p-8">
        The report is generated after Stage 7 completes. It will appear here, and
        be downloadable as a PDF.
      </p>
    );

  const sections = data?.sections ?? {};
  const names = Object.keys(sections);

  if (names.length === 0)
    return <p className="text-sm text-ink/60 border border-dashed border-rule rounded p-8">No report yet.</p>;

  const ordered = [
    ...names.filter((n) => n === "Executive Summary"),
    ...names.filter((n) => n !== "Executive Summary"),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-ink/50">
          {data?.generatedAt ? `Generated ${new Date(data.generatedAt).toLocaleString()}` : "Generated report"}
        </div>
        <button
          onClick={() => downloadBlob(`/contracts/${caseId}/report?download=true`)}
          className="bg-ink text-paper px-4 py-2 rounded text-sm font-medium"
        >
          Download PDF
        </button>
      </div>

      {ordered.map((name) => (
        <div key={name} className="bg-white border border-rule rounded p-5 mb-4">
          <h3 className="text-lg mb-2">{name}</h3>
          <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: sections[name] }} />
        </div>
      ))}
    </div>
  );
}
