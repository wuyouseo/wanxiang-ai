import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // CSS-variable-driven so the light/dark tokens defined in
        // src/styles/globals.css can be swapped by toggling the `.dark`
        // class on <html> — see useThemeStore. `<alpha-value>` keeps
        // Tailwind's opacity modifiers (e.g. bg-danger/10) working.
        // Named "canvas" (not "base") deliberately: Tailwind's default
        // fontSize scale already owns the key "base" (text-base = 1rem), so
        // a color literally named "base" collides with that on the shared
        // "text-" prefix — text-base silently stops meaning font-size and
        // starts meaning this color instead. Any non-colliding name works.
        canvas: "rgb(var(--color-base) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        surface2: "rgb(var(--color-surface-2) / <alpha-value>)",
        border: {
          subtle: "var(--color-border-subtle)",
          strong: "var(--color-border-strong)",
        },
        text: {
          primary: "rgb(var(--color-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
          muted: "rgb(var(--color-text-muted) / <alpha-value>)",
        },
        accent: {
          violet: "rgb(var(--color-accent-violet) / <alpha-value>)",
          cyan: "rgb(var(--color-accent-cyan) / <alpha-value>)",
        },
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #7C5CFF 0%, #42E8E0 100%)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "Segoe UI",
          '"HarmonyOS Sans SC"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          "sans-serif",
        ],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "16px",
        control: "10px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,0.35)",
        glow: "0 0 24px rgba(124,92,255,0.35)",
        "glow-sm": "0 0 14px rgba(124,92,255,0.30)",
        "glow-cyan": "0 0 24px rgba(66,232,224,0.28)",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "33%": { transform: "translate3d(24px, -18px, 0) scale(1.06)" },
          "66%": { transform: "translate3d(-16px, 14px, 0) scale(0.96)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(-28px, 22px, 0) scale(1.08)" },
        },
      },
      animation: {
        breathe: "breathe 1.8s ease-in-out infinite",
        float: "float 11s ease-in-out infinite",
        "float-slow": "float-slow 15s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
