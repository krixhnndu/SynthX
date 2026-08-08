import { Reveal } from "./primitives";

export function SceneFinal() {
  return (
    <section className="sx-paper-grain relative border-t border-sx-rule bg-sx-secondary/50">
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-32 text-center sm:px-8 sm:py-44">
        <Reveal>
          <span className="sx-label-mono">Synthx · Legal Intelligence</span>
          <h2 className="sx-display-xl mt-8 text-6xl sm:text-8xl">
            See what matters.
            <br />
            Control what happens next.
          </h2>
          <p className="mx-auto mt-7 max-w-lg text-base leading-relaxed text-sx-muted-foreground">
            Contract intelligence for decisions that matter.
          </p>
          <div className="mt-11 flex justify-center">
            <a
              href="/login"
              data-cursor="enter"
              className="group inline-flex items-center gap-3 bg-sx-foreground px-8 py-4 font-mono text-xs uppercase tracking-[0.24em] text-sx-primary-foreground transition-colors hover:bg-sx-crimson"
            >
              Enter SynthX
              <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-sx-rule">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm tracking-[0.34em]">SYNTHX</span>
          <span className="sx-label-mono">Contract intelligence</span>
        </div>
        <nav className="flex flex-wrap gap-6">
          <a href="#case" className="sx-label-mono hover:text-sx-foreground">Case</a>
          <a href="#intelligence" className="sx-label-mono hover:text-sx-foreground">Intelligence</a>
          <a href="#workflow" className="sx-label-mono hover:text-sx-foreground">Workflow</a>
          <a href="#audit" className="sx-label-mono hover:text-sx-foreground">Audit</a>
          <a href="/login" className="sx-label-mono hover:text-sx-foreground">Enter system</a>
        </nav>
      </div>
    </footer>
  );
}
