import { Reveal, SectionMark } from "./primitives";
import { useScrollProgress } from "../../hooks/useReveal";

const STAGES = [
  { name: "Contract", lines: ["Received from counterparty.", "Version pinned and hashed."] },
  { name: "AI analysis", lines: ["Clause extraction.", "Risk classification.", "Precedent comparison."] },
  { name: "Legal review", lines: ["Verify legal clauses.", "Review identified risks.", "Recommend revisions."] },
  {
    name: "Finance review",
    lines: ["Evaluate financial exposure.", "Validate payment terms.", "Approve or request changes."],
  },
  { name: "Compliance", lines: ["Policy and regulatory checks.", "Data-processing obligations."] },
  { name: "Final human review", lines: ["Final decision.", "AI assists.", "Human authority remains in control."] },
];

export function SceneWorkflow() {
  const { ref, progress } = useScrollProgress();
  const reached = Math.round(Math.min(1, Math.max(0, (progress - 0.15) / 0.55)) * STAGES.length);

  return (
    <section id="workflow" className="border-y border-sx-rule bg-sx-secondary/40">
      <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-36">
        <Reveal>
          <SectionMark index="04" label="The Workflow" />
          <h2 className="sx-display-xl mt-7 max-w-3xl text-5xl sm:text-7xl">
            Understanding is only the first step.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-sx-muted-foreground">
            Every agreement travels a controlled route. Each stage has an owner, a mandate and a
            record.
          </p>
        </Reveal>

        <div ref={ref} className="relative mt-16 pl-8 sm:pl-12">
          <div className="absolute left-[9px] top-0 h-full w-px bg-sx-rule sm:left-[13px]" aria-hidden />
          <div
            className="absolute left-[9px] top-0 w-px bg-sx-crimson transition-[height] duration-300 sm:left-[13px]"
            style={{ height: `${(reached / STAGES.length) * 100}%` }}
            aria-hidden
          />

          <ol className="space-y-5">
            {STAGES.map((stage, i) => {
              const on = i < reached;
              return (
                <li key={stage.name} className="relative" data-cursor="trace">
                  <span
                    className="absolute -left-8 top-5 size-[9px] rounded-full border transition-colors duration-500 sm:-left-12"
                    style={{
                      background: on ? "var(--sx-crimson)" : "var(--sx-paper)",
                      borderColor: on ? "var(--sx-crimson)" : "var(--sx-rule)",
                    }}
                    aria-hidden
                  />
                  <div
                    className="group sx-sheet px-5 py-4 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[var(--sx-shadow-lift)]"
                    style={{
                      opacity: on ? 1 : 0.45,
                      borderColor: on ? "var(--sx-paper-edge)" : "var(--sx-border)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-xs uppercase tracking-[0.22em]">{stage.name}</span>
                      <span className="sx-label-mono">
                        {String(i + 1).padStart(2, "0")} / {STAGES.length}
                      </span>
                    </div>
                    <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]">
                      <ul className="overflow-hidden">
                        {stage.lines.map((line) => (
                          <li key={line} className="pt-2 text-sm text-sx-muted-foreground">
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
