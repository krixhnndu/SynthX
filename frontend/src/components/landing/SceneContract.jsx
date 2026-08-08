import { useState } from "react";
import { Reveal, SectionMark } from "./primitives";

export const FINDINGS = [
  {
    id: "f1",
    clause: "4.2",
    title: "Liability",
    text: "…the supplier shall be liable for all losses arising from any breach, without limitation as to amount…",
    level: "high",
    verdict: "Unlimited liability",
    detail: "Potential financial exposure may extend beyond the agreed contract value.",
    action: "Request a liability cap at 12 months of fees.",
  },
  {
    id: "f2",
    clause: "7.4",
    title: "Payment terms",
    text: "…invoices shall be settled within ninety (90) days of receipt, net of any disputed amounts…",
    level: "medium",
    verdict: "Extended payment window",
    detail: "Ninety-day settlement deviates from the standard forty-five day policy.",
    action: "Negotiate to Net 45 or add late-payment interest.",
  },
  {
    id: "f3",
    clause: "11.1",
    title: "Confidentiality",
    text: "…each party shall protect confidential information with no less than reasonable care for five (5) years…",
    level: "positive",
    verdict: "Strong confidentiality protection",
    detail: "Mutual obligations, defined survival period, clear carve-outs.",
    action: "No change required.",
  },
  {
    id: "f4",
    clause: "14.3",
    title: "Dispute resolution",
    text: "…disputes shall be referred to binding arbitration seated in the courts of the licensee's jurisdiction…",
    level: "positive",
    verdict: "Clear dispute-resolution mechanism",
    detail: "Named seat, defined escalation path, no ambiguous forum selection.",
    action: "No change required.",
  },
];

const LEVEL_LABEL = { high: "High risk", medium: "Medium risk", positive: "Positive" };
const LEVEL_TEXT = { high: "text-sx-crimson", medium: "text-sx-amber", positive: "text-sx-olive" };
const LEVEL_BG = { high: "bg-sx-crimson", medium: "bg-sx-amber", positive: "bg-sx-olive" };

export function SceneContract() {
  const [active, setActive] = useState("f1");
  const current = FINDINGS.find((f) => f.id === active) ?? FINDINGS[0];

  return (
    <section id="case" className="mx-auto max-w-6xl px-5 py-28 sm:px-8 sm:py-36">
      <Reveal>
        <SectionMark index="01" label="The Contract" />
        <h2 className="sx-display-xl mt-7 text-5xl sm:text-7xl">First, we read.</h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-sx-muted-foreground">
          Every clause contains a decision, a risk, or an opportunity. SynthX reads the entire
          document — not only the parts that go wrong.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <Reveal>
          <div className="sx-paper-grain sx-sheet-lift p-6 sm:p-8" data-cursor="inspect">
            <div className="relative z-10">
              <div className="flex items-center justify-between pb-1">
                <span className="sx-label-mono">Vendor Agreement · Extract</span>
                <span className="sx-label-mono">Case #SX-02481</span>
              </div>

              <div className="mt-6 space-y-1">
                {FINDINGS.map((f) => {
                  const isActive = f.id === active;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onMouseEnter={() => setActive(f.id)}
                      onFocus={() => setActive(f.id)}
                      onClick={() => setActive(f.id)}
                      aria-pressed={isActive}
                      className={
                        "group block w-full border-l-2 px-4 py-4 text-left transition-all duration-300 " +
                        (isActive
                          ? "border-sx-crimson bg-sx-accent/60 translate-x-1"
                          : "border-transparent hover:border-sx-rule hover:bg-sx-accent/30")
                      }
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-[11px] tracking-[0.2em] text-sx-muted-foreground">
                          {f.clause} {f.title.toUpperCase()}
                        </span>
                        <span
                          className={
                            "flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-opacity duration-300 " +
                            LEVEL_TEXT[f.level] +
                            (isActive ? " opacity-100" : " opacity-0 group-hover:opacity-100")
                          }
                        >
                          <span className={"size-1.5 rounded-full " + LEVEL_BG[f.level]} />
                          {LEVEL_LABEL[f.level]}
                        </span>
                      </div>
                      <p
                        className={
                          "mt-2 text-sm leading-relaxed transition-colors " +
                          (isActive ? "text-sx-foreground" : "text-sx-muted-foreground")
                        }
                      >
                        {f.text}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-between sx-rule-line pt-4">
                <span className="sx-label-mono">Signed · A. Reyes / M. Kang</span>
                <span className="sx-label-mono text-sx-crimson">Internal</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <aside className="sticky top-24 sx-sheet p-6">
            <span className="sx-label-mono">Intelligence panel</span>
            <div className={"mt-4 font-mono text-xs uppercase tracking-[0.22em] " + LEVEL_TEXT[current.level]}>
              {LEVEL_LABEL[current.level]}
            </div>
            <h3 className="sx-display-xl mt-2 text-3xl">{current.verdict}</h3>
            <p className="sx-label-mono mt-3">Section {current.clause}</p>
            <p className="mt-4 text-sm leading-relaxed text-sx-muted-foreground">{current.detail}</p>
            <div className="mt-6 sx-rule-line pt-4">
              <span className="sx-label-mono">Recommended action</span>
              <p className="mt-2 text-sm text-sx-foreground">{current.action}</p>
            </div>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
