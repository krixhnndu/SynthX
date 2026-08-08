import { useEffect } from "react";
import "../styles/landing.css";
import { CursorLabel } from "../components/landing/CursorLabel";
import { LandingNav } from "../components/landing/LandingNav";
import { HeroCaseFile } from "../components/landing/HeroCaseFile";
import { SceneContract } from "../components/landing/SceneContract";
import { SceneIntelligence } from "../components/landing/SceneIntelligence";
import { SceneRisk } from "../components/landing/SceneRisk";
import { SceneWorkflow } from "../components/landing/SceneWorkflow";
import { SceneDecision } from "../components/landing/SceneDecision";
import { SceneAudit } from "../components/landing/SceneAudit";
import { SceneFinal, LandingFooter } from "../components/landing/SceneFinal";

const TITLE = "SynthX — Contract Intelligence for High-Stakes Decisions";
const DESCRIPTION =
  "AI-powered contract intelligence and controlled approval workflows: read every clause, map the risk, and keep the final decision human.";

export default function Landing() {
  useEffect(() => {
    const prevScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";

    const prevTitle = document.title;
    document.title = TITLE;

    let meta = document.querySelector('meta[name="description"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    const prevContent = meta.getAttribute("content");
    meta.setAttribute("content", DESCRIPTION);

    return () => {
      document.documentElement.style.scrollBehavior = prevScrollBehavior;
      document.title = prevTitle;
      if (created) {
        meta.remove();
      } else if (prevContent !== null) {
        meta.setAttribute("content", prevContent);
      }
    };
  }, []);

  return (
    <main id="top" className="sx-landing sx-paper-grain min-h-screen bg-sx-background">
      <CursorLabel />
      <LandingNav />

      <section className="relative z-10 mx-auto grid max-w-6xl gap-14 px-5 pb-24 pt-32 sm:px-8 sm:pb-32 sm:pt-40 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-16">
        <div>
          <div className="sx-anim-fade-up flex items-center gap-3" style={{ animationDelay: "120ms" }}>
            <span className="sx-label-mono text-sx-crimson">Case #SX-02481</span>
            <span className="h-px w-8 bg-sx-rule" />
            <span className="sx-label-mono">Confidential</span>
          </div>

          <h1 className="sx-display-xl sx-anim-fade-up mt-8 text-6xl sm:text-8xl" style={{ animationDelay: "260ms" }}>
            Contracts.
            <br />
            <span className="relative inline-block">
              Understood.
              <span
                className="absolute -bottom-1 left-0 h-[3px] w-full origin-left bg-sx-crimson"
                style={{ animation: "sx-underline 900ms cubic-bezier(.22,1,.36,1) 1.1s both" }}
              />
            </span>
          </h1>

          <p
            className="sx-anim-fade-up mt-8 max-w-md text-base leading-relaxed text-sx-muted-foreground"
            style={{ animationDelay: "460ms" }}
          >
            AI-powered contract intelligence and controlled approval workflows for high-stakes
            decisions.
          </p>

          <div className="sx-anim-fade-up mt-10 flex flex-wrap items-center gap-4" style={{ animationDelay: "620ms" }}>
            <a
              href="/login"
              data-cursor="enter"
              className="group inline-flex items-center gap-3 bg-sx-foreground px-7 py-3.5 font-mono text-xs uppercase tracking-[0.22em] text-sx-primary-foreground transition-colors hover:bg-sx-crimson"
            >
              Enter SynthX
              <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </a>
            <a
              href="#case"
              className="group inline-flex items-center gap-3 border border-sx-rule px-7 py-3.5 font-mono text-xs uppercase tracking-[0.22em] transition-colors hover:border-sx-foreground"
            >
              Explore the case
              <span className="transition-transform duration-300 group-hover:translate-y-1">↓</span>
            </a>
          </div>
        </div>

        <HeroCaseFile />
      </section>

      <SceneContract />
      <SceneIntelligence />
      <SceneRisk />
      <SceneWorkflow />
      <SceneDecision />
      <SceneAudit />
      <SceneFinal />
      <LandingFooter />
    </main>
  );
}
