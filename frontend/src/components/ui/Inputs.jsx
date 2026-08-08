import { Eyebrow } from "./Primitives";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const FIELD =
  "w-full border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-faint " +
  "transition-colors focus:border-ink";

export function Label({ htmlFor, children, hint }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block">
      <Eyebrow className="text-muted">
        {children}
        {hint && <span className="ml-2 text-faint normal-case tracking-normal">{hint}</span>}
      </Eyebrow>
    </label>
  );
}

export function TextInput({ className, ...props }) {
  return <input {...props} className={cx(FIELD, className)} />;
}

export function TextArea({ className, ...props }) {
  return <textarea {...props} className={cx(FIELD, "resize-y", className)} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select {...props} className={cx(FIELD, className)}>
      {children}
    </select>
  );
}

export function Checkbox({ label, hint, ...props }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        {...props}
        className="h-3.5 w-3.5 shrink-0 accent-ink border border-rule bg-paper"
      />
      <span className="truncate">{label}</span>
      {hint && <span className="truncate font-mono text-2xs text-faint">{hint}</span>}
    </label>
  );
}

/** Underlined tab row. Replaces the pill buttons used for filters and toggles. */
export function TabRow({ options, value, onChange, className }) {
  return (
    <div className={cx("flex flex-wrap items-center gap-6 border-b border-rule", className)}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value ?? "all"}
            onClick={() => onChange(opt.value)}
            aria-current={active ? "true" : undefined}
            className={cx(
              "-mb-px border-b py-2 font-mono text-2xs uppercase tracking-label cursor-pointer transform transition-transform duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0.5",
              active ? "border-ink text-ink" : "border-transparent text-faint"
            )}
          >
            {opt.label}
            {opt.count != null && <span className="ml-2 text-faint">{opt.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
