import {
  PIPELINE,
  RUN_STATE_BAR,
  RUN_STATE_MARK,
  RUN_STATE_TEXT,
  runsByAgent,
  stageState,
} from "../lib/pipeline";
import { titleCase } from "../lib/format";
import { Eyebrow } from "./ui/Primitives";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/** Eight-segment strip. Answers "where is this contract right now" at a glance. */
export function StageRail({ status, caseStatus, className }) {
  const byAgent = runsByAgent(status?.agents);
  const current = status?.currentStage;

  return (
    <div className={cx("flex items-stretch gap-px", className)}>
      {PIPELINE.map((stage) => {
        const state = stageState(stage, byAgent, caseStatus, current);
        const isCurrent = current === stage.stage;
        return (
          <div
            key={stage.stage}
            title={`${stage.stage}. ${stage.label} — ${state}`}
            className="group relative flex-1"
          >
            <div className={cx("h-1 w-full transition-colors", RUN_STATE_BAR[state])} />
            <div
              className={cx(
                "mt-1.5 font-mono text-2xs uppercase tracking-label transition-colors",
                isCurrent ? "text-ink" : "text-faint"
              )}
            >
              {stage.stage}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Compact 8-tick indicator for table cells. */
export function StageTicks({ currentStage = 0, caseStatus }) {
  const done = caseStatus === "approved" || caseStatus === "rejected" ? 8 : currentStage ?? 0;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex gap-px" aria-hidden>
        {PIPELINE.map((s) => (
          <span
            key={s.stage}
            className={cx("h-2.5 w-1", s.stage <= done ? "bg-muted" : "bg-rule")}
          />
        ))}
      </span>
      <span className="font-mono text-2xs text-faint">{done}/8</span>
    </span>
  );
}

/** The processing view from the brief, built from real agent runs. */
export function PipelineChecklist({ status, caseStatus, className }) {
  const byAgent = runsByAgent(status?.agents);
  const current = status?.currentStage;

  return (
    <div className={className}>
      <Eyebrow>Pipeline</Eyebrow>
      <ul className="mt-3 divide-y divide-rule border-y border-rule">
        {PIPELINE.map((stage) => {
          const state = stageState(stage, byAgent, caseStatus, current);
          const failures = stage.agents
            .map((a) => byAgent[a])
            .filter((r) => r?.status === "failed" && r?.error);
          return (
            <li key={stage.stage} className="flex items-start gap-4 py-2.5">
              <span className={cx("w-4 shrink-0 text-center font-mono text-xs", RUN_STATE_TEXT[state])}>
                {RUN_STATE_MARK[state]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-sm text-ink">{stage.label}</span>
                  <span className={cx("font-mono text-2xs uppercase tracking-label", RUN_STATE_TEXT[state])}>
                    {state}
                  </span>
                </span>
                {stage.agents.length > 0 && (
                  <span className="mt-0.5 block font-mono text-2xs text-faint">
                    {stage.agents.map((a) => titleCase(a)).join(" · ")}
                  </span>
                )}
                {failures.map((r, i) => (
                  <span key={i} className="mt-1 block text-2xs text-severity-critical">
                    {r.agent}: {r.error}
                  </span>
                ))}
              </span>
              <span className="shrink-0 font-mono text-2xs text-faint">{stage.stage}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
