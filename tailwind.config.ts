import type { Config } from "tailwindcss";

/** NextP Clay System — tokens de design (ver docs/05-design-system.md). */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nextp: {
          blue: "#006DFF",
          light: "#72D7FF",
          bg: "#F7FBFF",
          card: "#FFFFFF",
          cardsoft: "#EEF6FF",
          ink: "#101828",
          muted: "#667085",
          success: "#12B76A",
          warning: "#F79009",
          danger: "#F04438",
          purple: "#9B7EDE",
          pink: "#FF7A9A",
          coin: "#FDB022",
          icon: "#2E86FF",
        },
      },
      borderRadius: {
        clay: "22px",
        "clay-lg": "28px",
        "clay-xl": "36px",
      },
      boxShadow: {
        clay: "0 10px 24px -6px rgba(0,109,255,0.22), 0 4px 10px -4px rgba(0,109,255,0.14)",
        "clay-sm": "0 4px 12px -4px rgba(0,109,255,0.20)",
        "clay-inset": "inset 0 2px 6px rgba(255,255,255,0.7), 0 8px 20px -8px rgba(0,109,255,0.25)",
        "clay-btn": "0 8px 18px -4px rgba(0,109,255,0.45)",
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
