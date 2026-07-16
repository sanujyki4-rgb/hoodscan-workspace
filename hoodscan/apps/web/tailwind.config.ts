import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "rgb(var(--color-base) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        lime: "rgb(var(--color-lime) / <alpha-value>)",
        "lime-dark": "rgb(var(--color-lime-dark) / <alpha-value>)",
        "lime-bright": "rgb(var(--color-lime-bright) / <alpha-value>)",
        "lime-bright-dark": "rgb(var(--color-lime-bright-dark) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
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
