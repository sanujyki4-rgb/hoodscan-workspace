import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0A0B0D",
        panel: "#14171A",
        border: "#23272B",
        ink: "#E7E9EA",
        muted: "#8B9298",
        accent: "#D4A72C",
        "accent-dim": "#8A6E22",
        finalized: "#3FB27F",
        pending: "#8B9298",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-data)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
