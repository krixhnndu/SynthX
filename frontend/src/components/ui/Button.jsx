const cx = (...parts) => parts.filter(Boolean).join(" ");

const VARIANTS = {
  primary: "bg-ink text-paper border border-ink disabled:bg-ink disabled:text-paper disabled:border-ink",
  secondary: "border border-ruleHi text-ink disabled:border-ruleHi disabled:text-ink",
  ghost: "border border-transparent text-muted disabled:border-transparent disabled:text-muted",
  danger: "border border-severity-critical/70 text-severity-critical disabled:border-severity-critical/70 disabled:text-severity-critical",
};

const SIZES = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-4 py-2 text-sm",
};

export default function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 font-medium transition-transform duration-150 ease-out transform hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {children}
    </button>
  );
}
