/** Hairline 14px glyphs. Deliberately plain — the nav is labels first. */
const base = {
  width: 14,
  height: 14,
  viewBox: "0 0 14 14",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.1,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const IconCases = (p) => (
  <svg {...base} {...p}>
    <path d="M2.5 1.5h6l3 3v8h-9z" />
    <path d="M8.5 1.5v3h3M4.5 7h5M4.5 9.5h5" />
  </svg>
);

export const IconApprovals = (p) => (
  <svg {...base} {...p}>
    <path d="M1.5 7l3.5 3.5L12.5 3" />
  </svg>
);

export const IconKnowledge = (p) => (
  <svg {...base} {...p}>
    <path d="M2 2.5h4a1.5 1.5 0 011.5 1.5v8A1.5 1.5 0 006 10.5H2z" />
    <path d="M12 2.5H8a1.5 1.5 0 00-1.5 1.5v8A1.5 1.5 0 018 10.5h4z" />
  </svg>
);

export const IconUsers = (p) => (
  <svg {...base} {...p}>
    <circle cx="5.5" cy="4.5" r="2" />
    <path d="M1.5 12c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5" />
    <path d="M9.5 3.2a2 2 0 010 3.6M10.5 8.9c1.3.4 2 1.5 2 3.1" />
  </svg>
);

export const IconMenu = (p) => (
  <svg {...base} {...p}>
    <path d="M2 3.5h10M2 7h10M2 10.5h10" />
  </svg>
);

export const IconClose = (p) => (
  <svg {...base} {...p}>
    <path d="M3 3l8 8M11 3l-8 8" />
  </svg>
);
