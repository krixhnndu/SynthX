import { useEffect, useState } from "react";

/**
 * Subtle contextual cursor label. Desktop / fine-pointer only.
 * Elements opt in with data-cursor="inspect" | "trace" | "enter" | "download".
 */
export function CursorLabel() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [label, setLabel] = useState(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      const target = e.target?.closest?.("[data-cursor]");
      setLabel(target ? (target.dataset["cursor"] ?? null) : null);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[60] hidden -translate-y-1/2 translate-x-4 md:block"
      style={{
        left: pos.x,
        top: pos.y,
        opacity: label ? 1 : 0,
        transition: "opacity 180ms ease",
      }}
    >
      <span className="border border-sx-crimson/60 bg-sx-paper/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-sx-crimson">
        {label}
      </span>
    </div>
  );
}
