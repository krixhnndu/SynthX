import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";

export function Reveal({ children, delay = 0, className, as: Comp = "div" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Comp
      ref={ref}
      className={cn("sx-reveal", className)}
      data-visible={visible}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Comp>
  );
}

export function SectionMark({ index, label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-sx-crimson">{index}</span>
      <span className="h-px w-10 bg-sx-rule" aria-hidden />
      <span className="sx-label-mono">{label}</span>
    </div>
  );
}
