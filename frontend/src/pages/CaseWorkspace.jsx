import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { useCaseSocket } from "../api/useCaseSocket";

import ContractViewer from "../components/sections/ContractViewer";
import ClauseExplorer from "../components/sections/ClauseExplorer";
import RiskHeatmap from "../components/sections/RiskHeatmap";
import Compliance from "../components/sections/Compliance";
import Comparison from "../components/sections/Comparison";
import Recommendations from "../components/sections/Recommendations";
import NegotiationStrategy from "../components/sections/NegotiationStrategy";
import Explainability from "../components/sections/Explainability";
import LiveAgentStatus from "../components/sections/LiveAgentStatus";
import ReviewApproval from "../components/sections/ReviewApproval";
import Report from "../components/sections/Report";
import Collaboration from "../components/sections/Collaboration";
import VersionHistory from "../components/sections/VersionHistory";

const SECTIONS = [
  { key: "viewer", label: "Contract", Component: ContractViewer },
  { key: "clauses", label: "Clauses", Component: ClauseExplorer },
  { key: "risk", label: "Risk", Component: RiskHeatmap },
  { key: "compliance", label: "Compliance", Component: Compliance },
  { key: "comparison", label: "Comparison", Component: Comparison },
  { key: "recommendations", label: "Recommendations", Component: Recommendations },
  { key: "negotiation", label: "Negotiation", Component: NegotiationStrategy },
  { key: "explainability", label: "Explainability", Component: Explainability },
  { key: "agents", label: "Agent status", Component: LiveAgentStatus },
  { key: "report", label: "Report", Component: Report },
  { key: "review", label: "Review & approval", Component: ReviewApproval },
  { key: "collaboration", label: "Collaboration", Component: Collaboration },
  { key: "history", label: "Version history", Component: VersionHistory },
];

export default function CaseWorkspace() {
  const { caseId } = useParams();
  const [active, setActive] = useState("viewer");
  useCaseSocket(caseId);

  const { data: contractCase, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => (await api.get(`/contracts/${caseId}`)).data,
  });

  const { data: status } = useQuery({
    queryKey: ["case-status", caseId],
    queryFn: async () => (await api.get(`/contracts/${caseId}/status`)).data,
  });

  if (isLoading) return <p className="p-10 text-sm text-ink/60">Loading case.</p>;

  const comparisonSkipped = contractCase?.comparison?.skipped;
  const visible = SECTIONS.filter((s) => !(s.key === "comparison" && comparisonSkipped));
  const Active = visible.find((s) => s.key === active)?.Component ?? ContractViewer;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <Link to="/dashboard" className="text-xs text-ink/50 underline">All cases</Link>
          <h1 className="text-2xl mt-1">Case {caseId.slice(0, 8)}</h1>
        </div>
        <div className="text-right text-sm">
          <div className="font-medium">{contractCase?.status}</div>
          <div className="text-ink/50 text-xs">Stage {status?.currentStage ?? 0} of 8</div>
        </div>
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-8">
        <nav className="text-sm">
          {visible.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`block w-full text-left px-3 py-2 rounded mb-0.5 ${
                active === s.key ? "bg-ink text-paper" : "hover:bg-white"
              }`}
            >
              {s.label}
            </button>
          ))}
          <Link
            to={`/contracts/${caseId}/audit`}
            className="block px-3 py-2 mt-2 text-ink/60 hover:bg-white rounded"
          >
            Audit trail
          </Link>
        </nav>

        <main className="min-h-[60vh]">
          <Active contractCase={contractCase} status={status} caseId={caseId} />
        </main>
      </div>
    </div>
  );
}
