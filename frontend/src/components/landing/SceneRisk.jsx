import { useState } from "react";
import { Reveal, SectionMark } from "./primitives";

const MARKERS = [
  {
    id: "m1",
    x: 24,
    y: 22,
    level: "high",
    category: "Legal",
    title: "Unlimited liability",
    section: "Section 4.2",
    detail: "Potential financial exposure may extend beyond the agreed contract value.",
    action: "Request a liability cap.",
  },
  {
    id: "m2",
    x: 68,
    y: 38,
    level: "medium",
    category: "Financial",
    title: "Net 90 settlement",
    section: "Section 7.4",
    detail: "Working-capital impact across the full thirty-six month term.",
    action: "Negotiate to Net 45.",
  },
  {
    id: "m3",
    x: 38,
    y: 62,
    level: "medium",
    category: "Compliance",
    title: "Sub-processor disclosure",
    section: "Section 12.6",
    detail: "Notification window for new sub-processors is undefined.",
    action: "Add a 30-day prior notice obligation.",
  },
  {
    id: "m4",
    x: 76,
    y: 74,
    level: "positive",
    category: "Operational",
    title: "Defined service levels",
    section: "Schedule B",
    detail: "Measurable uptime commitments with credit remedies.",
    action: "No change required.",
  },
  {
    id: "m5",
    x: 15,
    y: 82,
    level: "positive",
    category: "Legal",
    title: "Mutual confidentiality",
    section: "Section 11.1",
    detail: "Balanced obligations with a clear survival period.",
    action: "No change required.",
  },
];

const COLOR = { high: "var(--sx-crimson)", medium: "var(--sx-amber)", positive: "var(--sx-olive)" };
const LABEL = { high: "High risk", medium: "Medium risk", positive: "Positive" };

export function SceneRisk() {
  const [active, setActive] = useState("m1");
  const current = MARKERS.find((m) => m.id === active) ?? MARKERS[0];

  return (
    <section className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-36">
      <Reveal>
        <SectionMark index="03" label="The Risk" />
        <h2 className="sx-display-xl mt-7 text-5xl sm:text-7xl">Where the exposure lives.</h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-sx-muted-foreground">
          Findings are pinned to the page they came from. Legal, financial, compliance and
          operational — mapped across the document, not buried in a report.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <Reveal>
          <div
            className="sx-paper-grain relative sx-sheet-lift aspect-[4/5] w-full overflow-hidden sm:aspect-[5/4]"
            data-cursor="inspect"
          >
            <div className="absolute inset-0 z-0 flex flex-col gap-3 p-8 opacity-40" aria-hidden>
              {Array.from({ length: 22 }).map((_, i) => (
                <span
                  key={i}
                  className="block h-[6px] bg-sx-rule"
                  style={{ width: `${45 + ((i * 37) % 50)}%` }}
                />
              ))}
            </div>

            {MARKERS.map((m) => {
              const isActive = m.id === active;
              return (
                <button
                  key={m.id}
                  type="button"
                  onMouseEnter={() => setActive(m.id)}
                  onFocus={() => setActive(m.id)}
                  onClick={() => setActive(m.id)}
                  aria-label={`${LABEL[m.level]} — ${m.title}`}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${m.x}%`, top: `${m.y}%` }}
                >
                  <span
                    className="flex items-center gap-2 border bg-sx-paper/95 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-all duration-300"
                    style={{
                      borderColor: COLOR[m.level],
                      color: COLOR[m.level],
                      transform: isActive ? "scale(1.06)" : "scale(1)",
                      boxShadow: isActive ? "var(--sx-shadow-lift)" : "none",
                    }}
                  >
                    <span className="size-1.5 rounded-full" style={{ background: COLOR[m.level] }} />
                    {m.category}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <aside className="sticky top-24 sx-sheet p-6">
            <div className="font-mono text-xs uppercase tracking-[0.22em]" style={{ color: COLOR[current.level] }}>
              {LABEL[current.level]}
            </div>
            <h3 className="sx-display-xl mt-2 text-3xl">{current.title}</h3>
            <p className="sx-label-mono mt-3">
              {current.section} · {current.category}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-sx-muted-foreground">{current.detail}</p>
            <div className="mt-6 sx-rule-line pt-4">
              <span className="sx-label-mono">Recommended action</span>
              <p className="mt-2 text-sm text-sx-foreground">{current.action}</p>
            </div>
            <div className="mt-6 sx-rule-line pt-4 sx-label-mono">Contract analysis · 5 findings</div>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
