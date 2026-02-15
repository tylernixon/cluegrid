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
        correct: { DEFAULT: "#6AAA64", dark: "#538D4E" },
        present: { DEFAULT: "#C9B458", dark: "#B59F3B" },
        absent: { DEFAULT: "#787C7E", dark: "#3A3A3C" },
        accent: { DEFAULT: "#4A90D9", dark: "#5BA4E8" },
        surface: { DEFAULT: "#FFFFFF", dark: "#1E1E1F" },
        bg: { DEFAULT: "#FAFAFA", dark: "#121213" },
        "text-primary": { DEFAULT: "#1A1A1A", dark: "#FFFFFF" },
        "text-secondary": { DEFAULT: "#666666", dark: "#A0A0A0" },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      fontSize: {
        "grid-letter": ["24px", { lineHeight: "1", fontWeight: "700" }],
        "stat-number": ["32px", { lineHeight: "1", fontWeight: "600" }],
      },
      animation: {
        "cell-pop": "cell-pop 100ms ease-in-out",
        "cell-flip": "cell-flip 500ms ease-in-out",
        "row-shake": "row-shake 200ms ease-in-out",
      },
      keyframes: {
        "cell-pop": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        "cell-flip": {
          "0%": { transform: "rotateX(0deg)" },
          "50%": { transform: "rotateX(90deg)" },
          "100%": { transform: "rotateX(0deg)" },
        },
        "row-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
