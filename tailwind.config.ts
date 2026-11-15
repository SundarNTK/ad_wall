import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        danger: "hsl(var(--danger))",
        ring: "hsl(var(--ring))",
        harbor: {
          50: "rgb(var(--h-50) / <alpha-value>)",
          100: "rgb(var(--h-100) / <alpha-value>)",
          200: "rgb(var(--h-200) / <alpha-value>)",
          300: "rgb(var(--h-300) / <alpha-value>)",
          400: "rgb(var(--h-400) / <alpha-value>)",
          500: "rgb(var(--h-500) / <alpha-value>)",
          600: "rgb(var(--h-600) / <alpha-value>)",
          700: "rgb(var(--h-700) / <alpha-value>)",
          800: "rgb(var(--h-800) / <alpha-value>)",
          900: "rgb(var(--h-900) / <alpha-value>)",
          950: "rgb(var(--h-950) / <alpha-value>)",
        },
        brand: "rgb(var(--a-brand) / <alpha-value>)",
        surface: "rgb(var(--a-surface) / <alpha-value>)",
        "admin-bg": "rgb(var(--a-bg) / <alpha-value>)",
        sea: "rgb(var(--h-400) / <alpha-value>)",
        inkstone: "rgb(var(--a-ink) / <alpha-value>)",
        inkmute: "rgb(var(--a-mute) / <alpha-value>)",
      },
      boxShadow: {
        soft: "0 10px 40px -18px rgba(15, 23, 42, 0.35)",
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
