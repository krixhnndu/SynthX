export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12161c",
        paper: "#f7f6f3",
        rule: "#d9d6cf",
        severity: {
          low: "#5b8c5a",
          medium: "#c8922a",
          high: "#c25a2b",
          critical: "#a12b2b",
        },
      },
      fontFamily: {
        display: ["Spectral", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
