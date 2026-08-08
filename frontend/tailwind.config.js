/** SynthX — lighter neutral theme.
 *  Canvas and surfaces are soft; colour is reserved for risk, state and decision. */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f8fafc",     // canvas
        surface: "#ffffff",   // panel
        raised: "#eef2f7",    // hover / nested
        rule: "#d6d9e1",      // hairline
        ruleHi: "#c2c8d2",    // structural divider
        ink: "#111827",       // primary text
        muted: "#475569",     // secondary text
        faint: "#64748b",     // tertiary / disabled
        severity: {
          critical: "#b4382f",
          high: "#c0662e",
          medium: "#bd8f2b",
          low: "#4e8a5f",
          info: "#3b82f6",
        },
        sx: {
          background: "#f5f1e8",
          foreground: "#1d1f27",
          paper: "#fdfbf7",
          "paper-edge": "#e8dfcf",
          secondary: "#efe9df",
          "secondary-foreground": "#3a3e45",
          muted: "#f3efe8",
          "muted-foreground": "#666a73",
          accent: "#f0e6dd",
          "accent-foreground": "#2f332f",
          primary: "#1d1f27",
          "primary-foreground": "#f7f4ef",
          border: "#e2d8c6",
          rule: "#d8d1c4",
          crimson: "#7b2a2a",
          amber: "#b88d3d",
          olive: "#536f52",
          slateblue: "#5a6689",
        },
      },
      fontFamily: {
        display: ["Spectral", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: { DEFAULT: "2px", sm: "1px", md: "3px" },
      letterSpacing: { label: "0.12em" },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      transitionDuration: { DEFAULT: "120ms" },
    },
  },
  plugins: [],
};
