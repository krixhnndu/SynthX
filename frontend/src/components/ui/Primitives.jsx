/** Shared structural pieces. Nothing here fetches or owns data. */

const cx = (...parts) => parts.filter(Boolean).join(" ");

/** A bordered region. Use only when the content is genuinely one group. */
export function Panel({ children, className, tone, flush = false }) {
  return (
    <div className={cx("relative border border-rule bg-surface", className)}>
      {tone && <span aria-hidden className={cx("absolute inset-y-0 left-0 w-px", tone)} />}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </div>
  );
}

/** Uppercase mono eyebrow. The workhorse label of the whole interface. */
export function Eyebrow({ children, className }) {
  return <div className={cx("label", className)}>{children}</div>;
}

/** heading -> information -> rule. Preferred over wrapping a section in a box. */
export function SectionHeading({ title, meta, actions, className }) {
  return (
    <div className={cx("flex items-end justify-between gap-4 border-b border-rule pb-2", className)}>
      <div className="min-w-0">
        <h2 className="font-display text-lg leading-tight text-ink">{title}</h2>
        {meta && <div className="label mt-1 truncate">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Label above value. Values that are identifiers or times set `mono`. */
export function Field({ label, value, mono = false, className }) {
  return (
    <div className={cx("min-w-0", className)}>
      <Eyebrow>{label}</Eyebrow>
      <div className={cx("mt-1 truncate text-sm text-ink", mono && "font-mono text-xs")}>
        {value ?? "—"}
      </div>
    </div>
  );
}

export function Divider({ className }) {
  return <hr className={cx("border-0 border-t border-rule", className)} />;
}

/** An empty screen is an invitation to act, so an action is encouraged. */
export function EmptyState({ title, children, action, className }) {
  return (
    <div className={cx("border border-dashed border-rule px-8 py-12 text-center", className)}>
      <Eyebrow className="text-faint">{title}</Eyebrow>
      {children && <p className="mx-auto mt-3 max-w-md text-sm text-muted">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/** Used while a stage has not run yet — distinct from an error. */
export function NotYet({ stage, children }) {
  return (
    <div className="border-l border-rule py-1 pl-4">
      <Eyebrow>Stage {stage} · not yet run</Eyebrow>
      <p className="mt-2 max-w-lg text-sm text-muted">{children}</p>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cx("animate-pulse bg-raised", className)} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="space-y-px" aria-hidden>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-rule/60 py-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cx("h-3", c === 0 ? "w-24" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Inline error copy: what happened, never an apology. */
export function ErrorNote({ children, className }) {
  if (!children) return null;
  return (
    <p className={cx("border-l border-severity-critical py-1 pl-3 text-sm text-severity-critical", className)}>
      {children}
    </p>
  );
}

export function Note({ children, className }) {
  if (!children) return null;
  return (
    <p className={cx("border-l border-severity-low py-1 pl-3 text-sm text-severity-low", className)}>
      {children}
    </p>
  );
}
