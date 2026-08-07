import { SEVERITY_BAR, SEVERITY_TEXT, STATUS_LABEL, STATUS_TONE, titleCase } from "../../lib/format";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/** Case status. Border + text only — a field of solid pills reads as noise. */
export function StatusTag({ status, className }) {
  if (!status) return <span className="text-faint">—</span>;
  return (
    <span
      className={cx(
        "inline-flex items-center border px-2 py-0.5 font-mono text-2xs uppercase tracking-label",
        STATUS_TONE[status] ?? "border-rule text-muted",
        className
      )}
    >
      {STATUS_LABEL[status] ?? titleCase(status)}
    </span>
  );
}

/** Severity. A dot carries the colour; the word carries the meaning. */
export function SeverityTag({ severity, className }) {
  if (!severity) return <span className="text-faint">—</span>;
  return (
    <span className={cx("inline-flex items-center gap-1.5", className)}>
      <span
        aria-hidden
        className={cx("h-1.5 w-1.5 shrink-0", SEVERITY_BAR[severity] ?? "bg-faint")}
      />
      <span
        className={cx(
          "font-mono text-2xs uppercase tracking-label",
          SEVERITY_TEXT[severity] ?? "text-muted"
        )}
      >
        {severity}
      </span>
    </span>
  );
}

/** Compliance pass / fail / uncertain. */
const RESULT_TONE = {
  pass: "text-severity-low",
  fail: "text-severity-critical",
  uncertain: "text-severity-medium",
};

export function ResultTag({ result }) {
  if (!result) return <span className="text-faint">—</span>;
  return (
    <span className={cx("font-mono text-2xs uppercase tracking-label", RESULT_TONE[result] ?? "text-muted")}>
      {result}
    </span>
  );
}

/** Clause reference. Always monospaced so it reads as a locator, not prose. */
export function ClauseRef({ children, onClick, linked = false, className }) {
  if (!children) return null;
  if (!linked)
    return (
      <span className={cx("font-mono text-2xs text-faint", className)} title="No matching clause in the parsed document">
        {children}
      </span>
    );
  return (
    <button
      onClick={onClick}
      className={cx(
        "font-mono text-2xs text-severity-info underline decoration-severity-info/40 underline-offset-2 transition-colors hover:decoration-severity-info",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Confidence({ value }) {
  if (value == null) return null;
  return (
    <span className="font-mono text-2xs text-faint">{Math.round(value * 100)}% confidence</span>
  );
}
