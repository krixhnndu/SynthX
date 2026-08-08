import { useEffect, useState } from "react";

const LINKS = [
  { href: "#case", label: "Case" },
  { href: "#intelligence", label: "Intelligence" },
  { href: "#workflow", label: "Workflow" },
  { href: "#audit", label: "Audit" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500 " +
        (scrolled
          ? "border-b border-sx-rule bg-sx-background/85 backdrop-blur-sm"
          : "border-b border-transparent")
      }
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-medium tracking-[0.34em] text-sx-foreground">
            SYNTHX
          </span>
          <span className="hidden sx-label-mono sm:inline">Legal Intelligence</span>
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="sx-label-mono relative transition-colors hover:text-sx-foreground">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/login"
            data-cursor="enter"
            className="group inline-flex items-center gap-2 border border-sx-foreground/80 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-sx-foreground transition-colors hover:bg-sx-foreground hover:text-sx-primary-foreground sm:px-4"
          >
            Enter System
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </a>
        </div>
      </nav>
    </header>
  );
}
