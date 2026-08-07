import { useEffect, useRef } from "react";
import { Eyebrow } from "./Primitives";

export default function Modal({ open, onClose, title, subtitle, children, footer }) {
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-paper/80 px-6 backdrop-blur-[1px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg border border-ruleHi bg-surface outline-none"
      >
        <div className="border-b border-rule px-6 py-4">
          <h2 className="font-display text-lg text-ink">{title}</h2>
          {subtitle && <Eyebrow className="mt-1 normal-case tracking-normal text-muted">{subtitle}</Eyebrow>}
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-rule px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
