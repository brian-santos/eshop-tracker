import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0a0c",
          900: "#111114",
          800: "#18181d",
          700: "#232329",
          600: "#3a3a44",
          500: "#55555f",
          400: "#8a8a94",
          300: "#b8b8c0",
          200: "#dddde2",
          100: "#efeff2",
        },
        flame: {
          DEFAULT: "#ff5b3a",
          muted: "#c9442a",
        },
        acid: {
          DEFAULT: "#d4ff3a",
        },
        mint: {
          DEFAULT: "#3affa1",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter-tight)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
