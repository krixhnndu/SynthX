import { Reveal, SectionMark } from "./primitives";
import { useReveal } from "../../hooks/useReveal";

const BRANCHES = [
  { label: "Liability", note: "Obligation type" },
  { label: "Financial exposure", note: "Impact vector" },
  { label: "High risk", note: "Classification", accent: true },
];

export function SceneIntelligence() {
  const { ref, visible } = useReveal(0.3);

  return (
    <section id="intelligence" className="relative overflow-hidden border-y border-sx-rule bg-sx-secondary/40">
      <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-36">
        <Reveal>
          <SectionMark index="02" label="The Intelligence" />
          <h2 className="sx-display-xl mt-7 text-5xl sm:text-7xl">Then, we understand.</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-sx-muted-foreground">
            Language becomes structure. Each clause is linked to the obligations, exposures and
            classifications it creates elsewhere in the agreement.
          </p>
        </Reveal>

        <div ref={ref} className="mt-16 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <div className="sx-paper-grain sx-sheet p-7" data-cursor="inspect">
              <div className="relative z-10">
                <span className="sx-label-mono">Source</span>
                <p className="mt-3 font-mono text-sm tracking-[0.18em]">CLAUSE 4.2</p>
                <p className="mt-4 text-sm leading-relaxed text-sx-muted-foreground">
                  “…the supplier shall be liable for all losses arising from any breach, without
                  limitation as to amount…”
                </p>
                <div className="mt-6 sx-rule-line pt-4 sx-label-mono">Parsed · 41 entities · 12 obligations</div>
              </div>
            </div>
          </Reveal>

          <div className="relative">
            <svg
              className="absolute left-0 top-0 hidden h-full w-24 lg:block"
              viewBox="0 0 96 260"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden
            >
              {[38, 130, 222].map((y, i) => (
                <path
                  key={y}
                  d={`M2 130 C 40 130, 44 ${y}, 92 ${y}`}
                  stroke={i === 2 ? "var(--sx-crimson)" : "var(--sx-rule)"}
                  strokeWidth="1.2"
                  strokeDasharray="200"
                  strokeDashoffset={visible ? 0 : 200}
                  style={{ transition: `stroke-dashoffset 900ms ease ${i * 220}ms` }}
                />
              ))}
            </svg>

            <ul className="space-y-4 lg:pl-28">
              {BRANCHES.map((b, i) => (
                <li
                  key={b.label}
                  className={
                    "sx-sheet flex items-center justify-between px-5 py-4 transition-all duration-700 " +
                    (b.accent ? "border-sx-crimson/40" : "")
                  }
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "none" : "translateX(16px)",
                    transitionDelay: `${300 + i * 220}ms`,
                  }}
                >
                  <span
                    className={
                      "font-mono text-xs uppercase tracking-[0.2em] " +
                      (b.accent ? "text-sx-crimson" : "text-sx-foreground")
                    }
                  >
                    {b.label}
                  </span>
                  <span className="sx-label-mono">{b.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
