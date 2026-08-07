/** The real pipeline, as exposed by GET /contracts/:id/status.
 *  Eight stages. Seven are agent stages; the eighth is the human review gate. */

export const PIPELINE = [
  { stage: 1, label: "Ingestion", agents: ["ocr_parsing"] },
  { stage: 2, label: "Clause extraction", agents: ["clause_classification"] },
  {
    stage: 3,
    label: "Analysis",
    agents: ["risk_assessment", "compliance_verification", "cross_document_comparison"],
  },
  { stage: 4, label: "Guidance", agents: ["recommendation", "negotiation_strategy"] },
  { stage: 5, label: "Supervision", agents: ["supervisor"] },
  { stage: 6, label: "Explainability", agents: ["explainability"] },
  { stage: 7, label: "Report", agents: ["report_generation"] },
  { stage: 8, label: "Human review", agents: [] },
];

export const RUN_STATE_TEXT = {
  completed: "text-severity-low",
  running: "text-severity-medium",
  failed: "text-severity-critical",
  skipped: "text-faint",
  pending: "text-faint",
};

export const RUN_STATE_BAR = {
  completed: "bg-severity-low",
  running: "bg-severity-medium",
  failed: "bg-severity-critical",
  skipped: "bg-ruleHi",
  pending: "bg-rule",
};

export const RUN_STATE_HEX = {
  completed: "#4e8a5f",
  running: "#bd8f2b",
  failed: "#b4382f",
  skipped: "#59606a",
  pending: "#1e242c",
};

export const RUN_STATE_MARK = {
  completed: "✓",
  running: "●",
  failed: "✕",
  skipped: "–",
  pending: "○",
};

export function runsByAgent(agents = []) {
  return Object.fromEntries(agents.map((r) => [r.agent, r]));
}

/** Collapse a stage's agent runs into one state for the rail. */
export function stageState(stage, byAgent, caseStatus, currentStage) {
  if (stage.agents.length === 0) {
    // The human review gate has no agent run behind it.
    if (caseStatus === "awaiting_review") return "running";
    if (["approved", "rejected", "changes_requested"].includes(caseStatus)) return "completed";
    return "pending";
  }
  const states = stage.agents.map((a) => byAgent[a]?.status ?? "pending");
  if (states.includes("failed")) return "failed";
  if (states.includes("running")) return "running";
  if (states.every((s) => s === "skipped")) return "skipped";
  if (states.every((s) => s === "completed" || s === "skipped")) return "completed";
  if (currentStage != null && stage.stage < currentStage) return "completed";
  return "pending";
}
