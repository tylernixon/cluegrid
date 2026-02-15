import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: { DEFAULT: "#F5F1EB", dark: "#1A1816" },
        surface: { DEFAULT: "#FFFFFF", dark: "#252220" },
        "surface-raised": { DEFAULT: "#FAF8F5", dark: "#2E2B28" },
        ink: { DEFAULT: "#2C2825", dark: "#EDE8E2" },
        "ink-secondary": { DEFAULT: "#7A7168", dark: "#9A9189" },
        "ink-tertiary": { DEFAULT: "#AEA69C", dark: "#605850" },
        border: { DEFAULT: "#E2DDD6", dark: "#3A3633" },
        "border-active": { DEFAULT: "#C4BDB4", dark: "#504B46" },
        correct: { DEFAULT: "#4A8B6E", dark: "#3D7A5D" },
        present: { DEFAULT: "#C4944A", dark: "#B8873E" },
        absent: { DEFAULT: "#B8B0A6", dark: "#4A4540" },
        accent: { DEFAULT: "#5B7FA6", dark: "#6B93B8" },
        "accent-hover": { DEFAULT: "#4A6B8E", dark: "#7DA3C6" },
        error: "#C45A4A",
      },
      fontFamily: {
        sans: [
          "var(--font-dm-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "var(--font-dm-mono)",
          "SF Mono",
          "Cascadia Code",
          "monospace",
        ],
      },
      fontSize: {
        display: [
          "2.5rem",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "heading-1": [
          "2rem",
          { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "600" },
        ],
        "heading-2": [
          "1.5rem",
          { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "heading-3": [
          "1.25rem",
          { lineHeight: "1.3", letterSpacing: "-0.005em", fontWeight: "600" },
        ],
        body: [
          "1rem",
          { lineHeight: "1.5", letterSpacing: "0", fontWeight: "400" },
        ],
        "body-small": [
          "0.875rem",
          { lineHeight: "1.5", letterSpacing: "0.005em", fontWeight: "400" },
        ],
        caption: [
          "0.75rem",
          { lineHeight: "1.4", letterSpacing: "0.02em", fontWeight: "500" },
        ],
        grid: [
          "1.75rem",
          { lineHeight: "1.0", letterSpacing: "0.05em", fontWeight: "700" },
        ],
        stat: [
          "2.25rem",
          { lineHeight: "1.1", letterSpacing: "-0.01em", fontWeight: "700" },
        ],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.06)",
        md: "0 4px 12px rgba(0,0,0,0.08)",
        lg: "0 8px 32px rgba(0,0,0,0.12)",
        glow: "0 0 24px rgba(74,139,110,0.3)",
        inset: "inset 0 0 0 1px rgba(0,0,0,0.05)",
      },
      animation: {
        "cell-pop": "cell-pop 80ms ease-out",
        "cell-flip": "cell-flip 500ms ease-in-out",
        "row-shake": "row-shake 200ms linear",
        "ink-fill": "ink-fill 200ms cubic-bezier(0.25, 0.1, 0.25, 1.0)",
      },
      keyframes: {
        "cell-pop": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.96)" },
        },
        "cell-flip": {
          "0%": { transform: "rotateX(0deg)" },
          "50%": { transform: "rotateX(90deg)" },
          "100%": { transform: "rotateX(0deg)" },
        },
        "row-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-4px)" },
          "40%": { transform: "translateX(4px)" },
          "60%": { transform: "translateX(-3px)" },
          "80%": { transform: "translateX(3px)" },
        },
        "ink-fill": {
          "0%": { clipPath: "inset(100% 0 0 0)" },
          "100%": { clipPath: "inset(0 0 0 0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
