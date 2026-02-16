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
        canvas: { DEFAULT: "#F5F1EB", dark: "#0A0A0F" },
        surface: { DEFAULT: "#FFFFFF", dark: "#14141A" },
        "surface-raised": { DEFAULT: "#FAF8F5", dark: "#1C1C24" },
        ink: { DEFAULT: "#2C2825", dark: "#F5F5F7" },
        "ink-secondary": { DEFAULT: "#7A7168", dark: "#A0A0A8" },
        "ink-tertiary": { DEFAULT: "#AEA69C", dark: "#606068" },
        border: { DEFAULT: "#E2DDD6", dark: "#2A2A32" },
        "border-active": { DEFAULT: "#C4BDB4", dark: "#3A3A44" },
        correct: { DEFAULT: "#4A8B6E", dark: "#4A9B7E" },
        // Revealed/hint letters - same green as correct to match logo
        revealed: { DEFAULT: "#4A8B6E", dark: "#4A9B7E" },
        // Crosser solved - warm beige/tan for solved crosser cells (not main row)
        "crosser-solved": { DEFAULT: "#E8DED2", dark: "#3D3832" },
        present: { DEFAULT: "#C4944A", dark: "#D4A45A" },
        absent: { DEFAULT: "#B8B0A6", dark: "#3A3A42" },
        accent: { DEFAULT: "#5B7FA6", dark: "#7B9FC6" },
        "accent-hover": { DEFAULT: "#4A6B8E", dark: "#8BAFD6" },
        error: "#C45A4A",
      },
      fontFamily: {
        sans: [
          "var(--font-ibm-plex-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        serif: [
          "var(--font-ibm-plex-serif)",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
        mono: [
          "var(--font-ibm-plex-mono)",
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
          { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "500" },
        ],
        "heading-2": [
          "1.5rem",
          { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "500" },
        ],
        "heading-3": [
          "1.25rem",
          { lineHeight: "1.3", letterSpacing: "-0.005em", fontWeight: "500" },
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
        "slide-up": "slide-up 300ms ease-out",
        "fade-in": "fade-in 400ms ease-out",
        "scale-in": "scale-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "confetti-fall": "confetti-fall 3s ease-in-out infinite",
        "gentle-pulse": "gentle-pulse 2s ease-in-out infinite",
        "streak-glow": "streak-glow 2s ease-in-out infinite",
        "countdown-tick": "countdown-tick 1s ease-in-out",
        "float": "float 3s ease-in-out infinite",
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
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-10px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100px) rotate(720deg)", opacity: "0" },
        },
        "gentle-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "streak-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 8px rgba(196, 148, 74, 0.4))" },
          "50%": { filter: "drop-shadow(0 0 16px rgba(196, 148, 74, 0.8))" },
        },
        "countdown-tick": {
          "0%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
