import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import UploadDialog from "../components/UploadDialog";

const STATUS_LABEL = {
  in_progress: "In review",
  awaiting_review: "Awaiting decision",
  approved: "Approved",
  changes_requested: "Changes requested",
  rejected: "Rejected",
};

export default function Dashboard() {
  const [filter, setFilter] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases", filter],
    queryFn: async () =>
      (await api.get("/contracts", { params: filter ? { status_filter: filter } : {} })).data,
  });

  const awaiting = cases.filter((c) => c.status === "awaiting_review").length;
  const highRisk = cases.filter((c) => (c.riskScore ?? 0) >= 0.7).length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-3xl">Cases</h1>
        <button
          onClick={() => setUploadOpen(true)}
          className="bg-ink text-paper px-4 py-2 rounded text-sm font-medium"
        >
          Upload contract
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Tile label="Open cases" value={cases.length} />
        <Tile label="Awaiting your decision" value={awaiting} />
        <Tile label="High risk" value={highRisk} />
      </div>

      <div className="flex gap-2 mb-4 text-sm">
        {["", "in_progress", "awaiting_review", "approved", "rejected"].map((value) => (
          <button
            key={value || "all"}
            onClick={() => setFilter(value)}
            className={`px-3 py-1 rounded border ${
              filter === value ? "bg-ink text-paper border-ink" : "border-rule"
            }`}
          >
            {value ? STATUS_LABEL[value] : "All"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-ink/60">Loading cases.</p>
      ) : cases.length === 0 ? (
        <div className="border border-dashed border-rule rounded p-10 text-center">
          <p className="mb-3">No cases yet.</p>
          <button onClick={() => setUploadOpen(true)} className="underline text-sm">
            Upload your first contract
          </button>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink/50">
            <tr className="border-b border-rule">
              <th className="py-2">Case</th>
              <th>Status</th>
              <th>Stage</th>
              <th>Risk</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr
                key={c.caseId}
                onClick={() => navigate(`/contracts/${c.caseId}`)}
                className="border-b border-rule/60 cursor-pointer hover:bg-white"
              >
                <td className="py-3 font-mono text-xs">{c.caseId.slice(0, 8)}</td>
                <td>{STATUS_LABEL[c.status] ?? c.status}</td>
                <td>{c.currentStage} of 8</td>
                <td>{c.riskScore != null ? c.riskScore.toFixed(2) : "—"}</td>
                <td className="text-ink/60">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => queryClient.invalidateQueries({ queryKey: ["cases"] })}
      />
    </div>
  );
}

function Tile({ label, value }) {
  return (
    <div className="border border-rule rounded p-4 bg-white">
      <div className="text-3xl font-display">{value}</div>
      <div className="text-xs uppercase tracking-wide text-ink/50 mt-1">{label}</div>
    </div>
  );
}
