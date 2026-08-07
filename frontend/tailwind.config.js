/** SynthX — institutional dark theme.
 *  Chrome is achromatic. Colour is reserved for risk, state and decision. */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#0a0c10",     // canvas
        surface: "#10141a",   // panel
        raised: "#161b23",    // hover / nested
        rule: "#1e242c",      // hairline
        ruleHi: "#2a323c",    // structural divider
        ink: "#e9e6df",       // primary text (warm bone)
        muted: "#8b929b",     // secondary text
        faint: "#59606a",     // tertiary / disabled
        severity: {
          critical: "#b4382f",
          high: "#c0662e",
          medium: "#bd8f2b",
          low: "#4e8a5f",
          info: "#4a7da6",
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
