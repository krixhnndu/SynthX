import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import DataTable from "../components/ui/DataTable";
import { TabRow } from "../components/ui/Inputs";
import { StatusTag } from "../components/ui/Tags";
import { StageTicks } from "../components/StageRail";
import { EmptyState, Eyebrow } from "../components/ui/Primitives";
import {
  SEVERITY_BAR,
  SEVERITY_TEXT,
  formatDate,
  formatDateTime,
  riskBand,
  shortId,
} from "../lib/format";

const DECISION_LABEL = {
  approve: "Approved",
  request_changes: "Requested changes",
  reject: "Rejected",
};

const DECISION_TONE = {
  approve: "text-severity-low",
  request_changes: "text-severity-high",
  reject: "text-severity-critical",
};

export default function Approvals() {
  const [tab, setTab] = useState("awaiting");
  const navigate = useNavigate();

  const { data: awaiting = [], isLoading } = useQuery({
    queryKey: ["approvals-awaiting"],
    queryFn: async () => (await api.get("/approvals/awaiting")).data,
  });

  const { data: decisions = [], isLoading: loadingDecisions } = useQuery({
    queryKey: ["approvals-decisions"],
    queryFn: async () => (await api.get("/approvals/decisions")).data,
  });

  const riskCell = (score) => {
    const band = riskBand(score);
    if (!band) return <span className="font-mono text-xs text-faint">—</span>;
    return (
      <span className="inline-flex items-center gap-2">
        <span aria-hidden className={`h-1.5 w-1.5 ${SEVERITY_BAR[band]}`} />
        <span className={`font-mono text-xs ${SEVERITY_TEXT[band]}`}>{score.toFixed(2)}</span>
      </span>
    );
  };

  const awaitingColumns = [
    {
      key: "caseId",
      header: "Case",
      render: (c) => <span className="font-mono text-xs text-ink">{shortId(c.caseId)}</span>,
    },
    {
      key: "stage",
      header: "Progress",
      render: (c) => <StageTicks currentStage={c.currentStage} caseStatus="awaiting_review" />,
    },
    { key: "risk", header: "Risk", render: (c) => riskCell(c.riskScore) },
    {
      key: "createdAt",
      header: "Created",
      render: (c) => <span className="font-mono text-xs text-faint">{formatDate(c.createdAt)}</span>,
    },
    {
      key: "canApprove",
      header: "Your authority",
      align: "right",
      render: (c) =>
        c.canApprove ? (
          <span className="font-mono text-2xs uppercase tracking-label text-severity-low">
            Can decide
          </span>
        ) : (
          <span
            className="font-mono text-2xs uppercase tracking-label text-faint"
            title="Your role may not decide at this case's risk level"
          >
            View only
          </span>
        ),
    },
  ];

  const decisionColumns = [
    {
      key: "caseId",
      header: "Case",
      render: (d) => <span className="font-mono text-xs text-ink">{shortId(d.caseId)}</span>,
    },
    {
      key: "decision",
      header: "Your decision",
      render: (d) => (
        <span
          className={`font-mono text-2xs uppercase tracking-label ${
            DECISION_TONE[d.decision] ?? "text-muted"
          }`}
        >
          {DECISION_LABEL[d.decision] ?? d.decision}
        </span>
      ),
    },
    {
      key: "comment",
      header: "Comment",
      width: "34%",
      render: (d) => (
        <span className="block truncate text-xs text-muted">{d.comment || "—"}</span>
      ),
    },
    { key: "caseStatus", header: "Case now", render: (d) => <StatusTag status={d.caseStatus} /> },
    {
      key: "at",
      header: "When",
      align: "right",
      render: (d) => <span className="font-mono text-xs text-faint">{formatDateTime(d.at)}</span>,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <Eyebrow>Governance</Eyebrow>
      <h1 className="mt-1 font-display text-3xl leading-none text-ink">Approvals</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Cases reach this queue once the pipeline finishes. Whether you can decide depends
        on your role and the case&rsquo;s risk score.
      </p>

      <TabRow
        className="mt-8"
        value={tab}
        onChange={setTab}
        options={[
          { value: "awaiting", label: "Awaiting review", count: awaiting.length },
          { value: "decisions", label: "My decisions", count: decisions.length },
        ]}
      />

      {tab === "awaiting" ? (
        <DataTable
          className="mt-1"
          columns={awaitingColumns}
          rows={awaiting}
          rowKey={(c) => c.caseId}
          onRowClick={(c) => navigate(`/contracts/${c.caseId}`)}
          tone={(c) => (c.canApprove ? "bg-severity-medium" : "bg-rule")}
          loading={isLoading}
          empty={
            <EmptyState title="Queue clear">
              No cases are waiting on a decision right now.
            </EmptyState>
          }
        />
      ) : (
        <DataTable
          className="mt-1"
          columns={decisionColumns}
          rows={decisions}
          rowKey={(d, i) => `${d.caseId}-${i}`}
          onRowClick={(d) => navigate(`/contracts/${d.caseId}`)}
          loading={loadingDecisions}
          empty={
            <EmptyState title="No decisions recorded">
              Decisions you make on a case appear here with their timestamp.
            </EmptyState>
          }
        />
      )}
    </div>
  );
}
