import { useState } from "react";
import { Reveal, SectionMark } from "./primitives";

const EVENTS = [
  { time: "09:41", title: "Contract uploaded", actor: "A. Reyes · Procurement", note: "Vendor Agreement v3 · SHA-256 recorded." },
  { time: "09:57", title: "Legal review assigned", actor: "System", note: "Routed to M. Kang under policy LGL-04." },
  { time: "10:15", title: "AI analysis completed", actor: "SynthX Engine", note: "5 findings · 1 high · 2 medium · 2 positive." },
  { time: "10:42", title: "Finance approved", actor: "D. Oyelaran · Finance", note: "Net 45 revision accepted by counterparty." },
  { time: "11:08", title: "Compliance review", actor: "S. Ferreira · Compliance", note: "Sub-processor notice clause added." },
  { time: "11:34", title: "Final decision", actor: "M. Kang · General Counsel", note: "Approved with liability cap at 12 months of fees." },
];

export function SceneAudit() {
  const [open, setOpen] = useState(0);

  return (
    <section id="audit" className="border-t border-sx-rule">
      <div className="mx-auto max-w-4xl px-5 py-28 sm:px-8 sm:py-36">
        <Reveal>
          <SectionMark index="05" label="The Audit Trail" />
          <h2 className="sx-display-xl mt-7 text-5xl sm:text-7xl">Every decision leaves a trace.</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-sx-muted-foreground">
            An institutional record of who saw what, when, and on what basis they decided.
          </p>
        </Reveal>

        <ol className="mt-14 border-l border-sx-rule">
          {EVENTS.map((e, i) => (
            <Reveal key={e.time} delay={i * 70}>
              <li className="relative pl-8 sm:pl-10" onMouseEnter={() => setOpen(i)} data-cursor="trace">
                <span
                  className="absolute -left-[4.5px] top-6 size-2 rounded-full transition-colors"
                  style={{ background: open === i ? "var(--sx-crimson)" : "var(--sx-rule)" }}
                  aria-hidden
                />
                <button type="button" onClick={() => setOpen(i)} className="w-full border-b border-sx-rule py-5 text-left">
                  <div className="flex items-baseline gap-5">
                    <span className="font-mono text-xs tracking-[0.18em] text-sx-crimson">{e.time}</span>
                    <span className="text-base text-sx-foreground">{e.title}</span>
                  </div>
                  <div
                    className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500"
                    style={{ gridTemplateRows: open === i ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="pt-2 sx-label-mono">{e.actor}</p>
                      <p className="pt-1 text-sm text-sx-muted-foreground">{e.note}</p>
                    </div>
                  </div>
                </button>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
