import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import UploadDialog from "../components/UploadDialog";
import DataTable from "../components/ui/DataTable";
import Button from "../components/ui/Button";
import { TabRow } from "../components/ui/Inputs";
import { StatusTag } from "../components/ui/Tags";
import { StageTicks } from "../components/StageRail";
import { EmptyState, Eyebrow } from "../components/ui/Primitives";
import {
  SEVERITY_BAR,
  SEVERITY_TEXT,
  STATUS_BAR,
  STATUS_LABEL,
  formatDate,
  riskBand,
  shortId,
} from "../lib/format";

const FILTERS = [
  { value: "", label: "All" },
  { value: "in_progress", label: STATUS_LABEL.in_progress },
  { value: "awaiting_review", label: STATUS_LABEL.awaiting_review },
  { value: "approved", label: STATUS_LABEL.approved },
  { value: "rejected", label: STATUS_LABEL.rejected },
];

function normalizeCases(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function Dashboard() {
  const [filter, setFilter] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases", filter],
    queryFn: async () => {
      const { data } = await api.get("/contracts", {
        params: filter ? { status_filter: filter } : {},
      });
      return normalizeCases(data);
    },
  });

  // Attention counts must not move when the table is filtered.
  // With filter "" this is the same query, so React Query serves it from cache.
  const { data: allCases = [] } = useQuery({
    queryKey: ["cases", ""],
    queryFn: async () => {
      const { data } = await api.get("/contracts");
      return normalizeCases(data);
    },
  });

  const awaiting = allCases.filter((c) => c.status === "awaiting_review").length;
  const highRisk = allCases.filter((c) => (c.riskScore ?? 0) >= 0.7).length;
  const changes = allCases.filter((c) => c.status === "changes_requested").length;

  const columns = [
    {
      key: "caseId",
      header: "Case",
      width: "30%",
      render: (c) => (
        <span className="block min-w-0">
          <span className="block font-mono text-xs text-ink">{shortId(c.caseId)}</span>
          <span className="mt-0.5 block truncate text-xs text-faint">{c.filename ?? "—"}</span>
        </span>
      ),
    },
    { key: "status", header: "Status", render: (c) => <StatusTag status={c.status} /> },
    {
      key: "stage",
      header: "Progress",
      render: (c) => <StageTicks currentStage={c.currentStage} caseStatus={c.status} />,
    },
    {
      key: "risk",
      header: "Risk",
      render: (c) => {
        const band = riskBand(c.riskScore);
        if (!band) return <span className="font-mono text-xs text-faint">—</span>;
        return (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className={`h-1.5 w-1.5 ${SEVERITY_BAR[band]}`} />
            <span className={`font-mono text-xs ${SEVERITY_TEXT[band]}`}>
              {c.riskScore.toFixed(2)}
            </span>
          </span>
        );
      },
    },
    {
      key: "createdAt",
      header: "Created",
      align: "right",
      render: (c) => <span className="font-mono text-xs text-faint">{formatDate(c.createdAt)}</span>,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Workspace</Eyebrow>
          <h1 className="mt-1 font-display text-3xl leading-none text-ink">Cases</h1>
        </div>
        <Button variant="primary" onClick={() => setUploadOpen(true)}>
          Upload contract
        </Button>
      </div>

      {/* Attention band: heading -> information -> rule. No boxes. */}
      <div className="mt-8 grid grid-cols-1 gap-px border-y border-rule bg-rule sm:grid-cols-3">
        <Metric label="Awaiting your decision" value={awaiting} tone={awaiting ? STATUS_BAR.awaiting_review : null} />
        <Metric label="High risk" value={highRisk} tone={highRisk ? SEVERITY_BAR.high : null} />
        <Metric label="Changes requested" value={changes} tone={changes ? STATUS_BAR.changes_requested : null} />
      </div>

      <TabRow options={FILTERS} value={filter} onChange={setFilter} className="mt-10" />

      <DataTable
        className="mt-1"
        columns={columns}
        rows={cases}
        rowKey={(c) => c.caseId}
        onRowClick={(c) => navigate(`/contracts/${c.caseId}`)}
        tone={(c) => STATUS_BAR[c.status]}
        loading={isLoading}
        empty={
          <EmptyState
            title={filter ? "Nothing in this state" : "No cases yet"}
            action={
              filter ? (
                <Button size="sm" onClick={() => setFilter("")}>
                  Show all cases
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setUploadOpen(true)}>
                  Upload a contract
                </Button>
              )
            }
          >
            {filter
              ? "No cases currently hold this status."
              : "Upload a contract to start the eight-stage review."}
          </EmptyState>
        }
      />

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => queryClient.invalidateQueries({ queryKey: ["cases"] })}
      />
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="relative bg-paper px-5 py-5">
      {tone && <span aria-hidden className={`absolute inset-y-0 left-0 w-0.5 ${tone}`} />}
      <div className="font-display text-4xl leading-none text-ink">{value}</div>
      <Eyebrow className="mt-2">{label}</Eyebrow>
    </div>
  );
}
