/** Presentation-only helpers. Nothing here changes what the API returns. */

// The five statuses the backend actually emits.
export const STATUS_LABEL = {
  in_progress: "In review",
  awaiting_review: "Awaiting decision",
  approved: "Approved",
  changes_requested: "Changes requested",
  rejected: "Rejected",
};

// Full class strings — Tailwind cannot see interpolated names.
export const STATUS_TONE = {
  in_progress: "text-severity-info border-severity-info/50",
  awaiting_review: "text-severity-medium border-severity-medium/50",
  approved: "text-severity-low border-severity-low/50",
  changes_requested: "text-severity-high border-severity-high/50",
  rejected: "text-severity-critical border-severity-critical/50",
};

export const STATUS_BAR = {
  in_progress: "bg-severity-info",
  awaiting_review: "bg-severity-medium",
  approved: "bg-severity-low",
  changes_requested: "bg-severity-high",
  rejected: "bg-severity-critical",
};

export const SEVERITY_ORDER = ["critical", "high", "medium", "low"];
export const SEVERITY_WEIGHT = { low: 1, medium: 2, high: 3, critical: 4 };

export const SEVERITY_HEX = {
  critical: "#b4382f",
  high: "#c0662e",
  medium: "#bd8f2b",
  low: "#4e8a5f",
  info: "#4a7da6",
};

export const SEVERITY_TEXT = {
  critical: "text-severity-critical",
  high: "text-severity-high",
  medium: "text-severity-medium",
  low: "text-severity-low",
  info: "text-severity-info",
};

export const SEVERITY_BAR = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
  info: "bg-severity-info",
};

export const SEVERITY_BORDER = {
  critical: "border-severity-critical/60",
  high: "border-severity-high/60",
  medium: "border-severity-medium/60",
  low: "border-severity-low/60",
  info: "border-severity-info/60",
};

/** Risk score -> severity band. Mirrors the thresholds already used on the dashboard. */
export function riskBand(score) {
  if (score == null) return null;
  if (score >= 0.85) return "critical";
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

export const titleCase = (s) => (s ?? "").replace(/_/g, " ");

export const shortId = (id) => (id ?? "").slice(0, 8);

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export function formatTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export const pct = (v) => (v == null ? "—" : `${Math.round(v * 100)}%`);
