import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

const DECISION_LABEL = {
  approve: "Approved",
  request_changes: "Requested changes",
  reject: "Rejected",
};

export default function Approvals() {
  const [tab, setTab] = useState("awaiting");
  const navigate = useNavigate();

  const { data: awaiting = [], isLoading } = useQuery({
    queryKey: ["approvals-awaiting"],
    queryFn: async () => (await api.get("/approvals/awaiting")).data,
  });

  const { data: decisions = [] } = useQuery({
    queryKey: ["approvals-decisions"],
    queryFn: async () => (await api.get("/approvals/decisions")).data,
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link to="/dashboard" className="text-xs text-ink/50 underline">All cases</Link>
      <h1 className="text-3xl mt-1 mb-6">Approvals</h1>

      <div className="flex gap-2 mb-6 text-sm">
        <button
          onClick={() => setTab("awaiting")}
          className={`px-3 py-1 rounded border ${
            tab === "awaiting" ? "bg-ink text-paper border-ink" : "border-rule"
          }`}
        >
          Awaiting my review
        </button>
        <button
          onClick={() => setTab("decisions")}
          className={`px-3 py-1 rounded border ${
            tab === "decisions" ? "bg-ink text-paper border-ink" : "border-rule"
          }`}
        >
          My decisions
        </button>
      </div>

      {tab === "awaiting" ? (
        isLoading ? (
          <p className="text-sm text-ink/60">Loading.</p>
        ) : awaiting.length === 0 ? (
          <Empty>No cases are waiting for review.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink/50">
              <tr className="border-b border-rule">
                <th className="py-2">Case</th>
                <th>Stage</th>
                <th>Risk</th>
                <th>Created</th>
                <th>You can approve</th>
              </tr>
            </thead>
            <tbody>
              {awaiting.map((c) => (
                <tr
                  key={c.caseId}
                  onClick={() => navigate(`/contracts/${c.caseId}`)}
                  className="border-b border-rule/60 cursor-pointer hover:bg-white"
                >
                  <td className="py-3 font-mono text-xs">{c.caseId.slice(0, 8)}</td>
                  <td>{c.currentStage} of 8</td>
                  <td>{c.riskScore != null ? c.riskScore.toFixed(2) : "—"}</td>
                  <td className="text-ink/60">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    {c.canApprove ? (
                      <span className="text-severity-low">Yes</span>
                    ) : (
                      <span className="text-ink/40">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : decisions.length === 0 ? (
        <Empty>You have not made any decisions.</Empty>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink/50">
            <tr className="border-b border-rule">
              <th className="py-2">Case</th>
              <th>Decision</th>
              <th>Comment</th>
              <th>Case status</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {decisions.map((d, i) => (
              <tr
                key={i}
                onClick={() => navigate(`/contracts/${d.caseId}`)}
                className="border-b border-rule/60 cursor-pointer hover:bg-white"
              >
                <td className="py-3 font-mono text-xs">{d.caseId.slice(0, 8)}</td>
                <td>{DECISION_LABEL[d.decision] ?? d.decision}</td>
                <td className="text-ink/60">{d.comment ?? "—"}</td>
                <td>{d.caseStatus?.replace(/_/g, " ")}</td>
                <td className="text-ink/60">{new Date(d.at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Empty({ children }) {
  return (
    <p className="text-sm text-ink/60 border border-dashed border-rule rounded p-10 text-center">
      {children}
    </p>
  );
}
