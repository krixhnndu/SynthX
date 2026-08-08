import { Reveal } from "./primitives";

const COLUMNS = [
  {
    k: "AI",
    t: "Structured analysis",
    d: "Clauses parsed, obligations mapped, exposures classified against precedent.",
  },
  {
    k: "Human",
    t: "Judgment",
    d: "Context, relationship and commercial appetite — the parts a model cannot weigh.",
  },
  {
    k: "Decision",
    t: "Approval",
    d: "One accountable outcome, signed, timestamped and permanently recorded.",
  },
];

export function SceneDecision() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-40">
      <Reveal>
        <div className="text-center">
          <span className="sx-label-mono">Core principle</span>
          <h2 className="sx-display-xl mt-6 text-6xl sm:text-8xl">
            AI analyses.
            <br />
            <span className="text-sx-crimson">Humans decide.</span>
          </h2>
        </div>
      </Reveal>

      <div className="mt-16 grid gap-px border border-sx-rule bg-sx-rule sm:grid-cols-3">
        {COLUMNS.map((col, i) => (
          <Reveal key={col.k} delay={i * 120}>
            <div className="h-full bg-sx-paper p-8">
              <span className="sx-label-mono text-sx-crimson">{col.k}</span>
              <h3 className="sx-display-xl mt-4 text-3xl">{col.t}</h3>
              <p className="mt-4 text-sm leading-relaxed text-sx-muted-foreground">{col.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
