const cx = (...parts) => parts.filter(Boolean).join(" ");

const VARIANTS = {
  primary: "bg-ink text-paper hover:bg-white border border-ink",
  secondary: "border border-ruleHi text-ink hover:border-ink hover:bg-raised",
  ghost: "border border-transparent text-muted hover:text-ink hover:bg-raised",
  danger: "border border-severity-critical/70 text-severity-critical hover:bg-severity-critical/10",
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
        "inline-flex items-center justify-center gap-2 font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {children}
    </button>
  );
}
