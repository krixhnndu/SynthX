import { useEffect, useState } from "react";

const CASE_ID = "#SX-02481";

function useTyped(text, start, speed = 55) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!start) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setOut(text);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, start, speed]);
  return out;
}

/** Progressive hero sequence: paper → case no. → title → body → highlight → annotation → risk. */
export function HeroCaseFile() {
  const [step, setStep] = useState(0);
  const typed = useTyped(CASE_ID, step >= 1);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setStep(8);
      return;
    }
    const marks = [250, 900, 1750, 2350, 3100, 3600, 4100, 4600];
    const timers = marks.map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  const at = (n) => step >= n;
  const fade = (n, delay = 0) => ({
    opacity: at(n) ? 1 : 0,
    transform: at(n) ? "none" : "translateY(8px)",
    transition: `opacity 700ms ease ${delay}ms, transform 700ms cubic-bezier(.22,1,.36,1) ${delay}ms`,
  });

  return (
    <div className="relative" data-cursor="inspect">
      <div
        className="absolute -right-3 top-4 hidden h-full w-full sx-sheet sm:block"
        style={{ transform: "rotate(1.4deg)", opacity: at(1) ? 0.65 : 0, transition: "opacity 900ms ease" }}
        aria-hidden
      />
      <div
        className="absolute -left-2 top-2 hidden h-full w-full sx-sheet sm:block"
        style={{ transform: "rotate(-0.9deg)", opacity: at(1) ? 0.8 : 0, transition: "opacity 900ms ease" }}
        aria-hidden
      />

      <article
        className="sx-paper-grain relative sx-sheet-lift px-6 py-7 transition-transform duration-500 sm:px-9 sm:py-9 hover:-translate-y-1"
        style={{
          opacity: at(1) ? 1 : 0,
          transition: "opacity 800ms ease, transform 500ms cubic-bezier(.22,1,.36,1)",
        }}
      >
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="sx-label-mono">ClausePilot · Legal Intelligence</div>
              <div className="mt-2 font-mono text-sm tracking-[0.18em] text-sx-foreground">
                CASE FILE {typed}
                {step >= 1 && typed.length < CASE_ID.length && <span className="sx-caret">▌</span>}
              </div>
            </div>
            <div className="sx-label-mono text-sx-crimson">Confidential</div>
          </div>

          <div className="mt-5 sx-rule-line pt-5" style={fade(2)}>
            <h2 className="sx-display-xl text-3xl sm:text-4xl">Vendor Agreement</h2>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Parties" value="Acme Corporation" />
              <Field label="Counterparty" value="Northstar Systems" />
              <Field label="Status" value="Under review" />
            </div>
          </div>

          <div className="mt-6 sx-rule-line pt-5 space-y-3" style={fade(3)}>
            <p className="font-mono text-[11px] tracking-[0.18em] text-sx-muted-foreground">3.1 TERM</p>
            <p className="text-sm leading-relaxed text-sx-muted-foreground">
              This agreement shall commence on the effective date and continue for a period of
              thirty-six (36) months unless terminated in accordance with Section 9.
            </p>

            <div className="relative pt-2">
              <p className="font-mono text-[11px] tracking-[0.18em] text-sx-muted-foreground">
                4.2 LIABILITY
              </p>
              <p className="relative mt-2 text-sm leading-relaxed text-sx-foreground">
                <span
                  className="relative inline"
                  style={{
                    backgroundImage:
                      "linear-gradient(oklch(0.65 0.105 72 / 0.28), oklch(0.65 0.105 72 / 0.28))",
                    backgroundSize: at(5) ? "100% 100%" : "0% 100%",
                    backgroundRepeat: "no-repeat",
                    transition: "background-size 900ms cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  …the supplier shall be liable for all losses arising from any breach, without
                  limitation as to amount or category of damages…
                </span>
              </p>

              <svg
                className="pointer-events-none absolute -bottom-2 left-0 h-6 w-full"
                viewBox="0 0 400 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M4 16 C 90 6, 210 24, 330 10"
                  stroke="var(--sx-crimson)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeDasharray="420"
                  strokeDashoffset={at(6) ? 0 : 420}
                  style={{ transition: "stroke-dashoffset 900ms ease" }}
                />
              </svg>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 sx-rule-line pt-5">
            <div className="flex items-center gap-3" style={fade(7)}>
              <span className="inline-block size-2 rounded-full bg-sx-crimson" />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-sx-crimson">
                Risk marker · Section 4.2
              </span>
            </div>
            {at(8) && <div className="sx-stamp sx-anim-stamp text-xs font-medium">High Risk</div>}
          </div>
        </div>
      </article>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="sx-label-mono">{label}</div>
      <div className="mt-1 text-sm text-sx-foreground">{value}</div>
    </div>
  );
}
