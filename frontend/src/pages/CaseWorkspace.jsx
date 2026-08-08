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

import { StageRail } from "../components/StageRail";
import { StatusTag } from "../components/ui/Tags";
import { Eyebrow, Skeleton } from "../components/ui/Primitives";
import { PIPELINE } from "../lib/pipeline";
import { SEVERITY_TEXT, riskBand } from "../lib/format";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/** Thirteen sections, grouped by what the reader is trying to do. */
const GROUPS = [
  {
    label: "Document",
    items: [
      { key: "viewer", label: "Contract", Component: ContractViewer },
      { key: "clauses", label: "Clauses", Component: ClauseExplorer },
      { key: "comparison", label: "Comparison", Component: Comparison },
      { key: "history", label: "Version history", Component: VersionHistory },
    ],
  },
  {
    label: "Analysis",
    items: [
      { key: "risk", label: "Risk", Component: RiskHeatmap },
      { key: "compliance", label: "Compliance", Component: Compliance },
      { key: "explainability", label: "Explainability", Component: Explainability },
      { key: "report", label: "Report", Component: Report },
    ],
  },
  {
    label: "Guidance",
    items: [
      { key: "recommendations", label: "Recommendations", Component: Recommendations },
      { key: "negotiation", label: "Negotiation", Component: NegotiationStrategy },
    ],
  },
  {
    label: "Process",
    items: [
      { key: "agents", label: "Pipeline", Component: LiveAgentStatus },
      { key: "review", label: "Review & approval", Component: ReviewApproval },
      { key: "collaboration", label: "Collaboration", Component: Collaboration },
    ],
  },
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

  if (isLoading)
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-1 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  const comparisonSkipped = contractCase?.comparison?.skipped;
  const groups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !(i.key === "comparison" && comparisonSkipped)),
  }));

  const flat = groups.flatMap((g) => g.items);
  const Active = flat.find((s) => s.key === active)?.Component ?? ContractViewer;

  const band = riskBand(contractCase?.risk?.riskScore);
  const currentStage = status?.currentStage ?? 0;
  const stageLabel = PIPELINE.find((s) => s.stage === currentStage)?.label;

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        to="/dashboard"
        className="font-mono text-2xs uppercase tracking-label text-faint cursor-pointer transform transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0.5"
      >
        &larr; All cases
      </Link>

      {/* Identity band */}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <Eyebrow>Case</Eyebrow>
          <h1 className="mt-1 truncate font-display text-2xl leading-tight text-ink">
            {contractCase?.document?.filename ?? contractCase?.filename ?? "Contract"}
          </h1>
          <p className="mt-1 font-mono text-2xs text-faint">{caseId}</p>
        </div>

        <dl className="flex flex-wrap items-end gap-x-10 gap-y-4">
          <div>
            <Eyebrow>Status</Eyebrow>
            <dd className="mt-1.5">
              <StatusTag status={contractCase?.status} />
            </dd>
          </div>
          <div>
            <Eyebrow>Risk score</Eyebrow>
            <dd
              className={cx(
                "mt-1 font-display text-2xl leading-none",
                band ? SEVERITY_TEXT[band] : "text-faint"
              )}
            >
              {contractCase?.risk?.riskScore != null
                ? contractCase.risk.riskScore.toFixed(2)
                : "—"}
            </dd>
          </div>
          <div>
            <Eyebrow>Stage</Eyebrow>
            <dd className="mt-1 font-mono text-sm text-ink">
              {currentStage}/8
              {stageLabel && <span className="ml-2 text-2xs text-faint">{stageLabel}</span>}
            </dd>
          </div>
        </dl>
      </div>

      <StageRail
        className="mt-6"
        status={status}
        caseStatus={contractCase?.status}
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[188px_1fr]">
        <nav className="lg:sticky lg:top-20 lg:self-start" aria-label="Case sections">
          {groups.map((group) =>
            group.items.length === 0 ? null : (
              <div key={group.label} className="mb-6">
                <Eyebrow className="pb-1.5">{group.label}</Eyebrow>
                {group.items.map((item) => {
                  const on = active === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActive(item.key)}
                      aria-current={on ? "true" : undefined}
                      className={cx(
                        "relative block w-full border-l py-1.5 pl-3 text-left text-sm cursor-pointer transform transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0.5",
                        on ? "border-ink text-ink" : "border-rule text-muted"
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )
          )}
          <Link
            to={`/contracts/${caseId}/audit`}
            className="block border-l border-rule py-1.5 pl-3 text-sm text-muted cursor-pointer transform transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0.5"
          >
            Audit trail
          </Link>
          </Link>
        </nav>

        <main className="min-w-0">
          <Active contractCase={contractCase} status={status} caseId={caseId} />
        </main>
      </div>
    </div>
  );
}
