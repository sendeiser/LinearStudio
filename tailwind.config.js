/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "#f6f8fa",
        surface: "#ffffff",
        "surface-subtle": "#f3f4f6",
        "border-subtle": "#d0d7de",
        "border-muted": "#e2e8f0",
        "text-primary": "#1f2328",
        "text-secondary": "#57606a",
        "text-muted": "#8c959f",
        brand: "#0969da",
        "brand-hover": "#0854ad",
        "brand-subtle": "#ddf4ff",
        
        // Dark tokens
        "dark-canvas": "#090d16",
        "dark-surface": "#111827",
        "dark-surface-elevated": "#162032",
        "dark-border": "#243044",
        "dark-text": "#f8fafc",
        "dark-text-muted": "#94a3b8",
        "dark-brand": "#6366f1",
        "dark-brand-hover": "#4f46e5",

        // Semantics
        urgent: "#cf222e",
        "urgent-bg": "#ffebe9",
        "urgent-border": "#ff8182",
        high: "#9a6700",
        "high-bg": "#fff8c5",
        "high-border": "#d4a72c",
        medium: "#0969da",
        "medium-bg": "#ddf4ff",
        "medium-border": "#54aeff",
        low: "#57606a",
        "low-bg": "#f6f8fa",
        done: "#1a7f37",
        "done-bg": "#dafbe1",
        "done-border": "#4ac26b",
        pr: "#8250df",
        "pr-bg": "#fbefff"
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(31, 35, 40, 0.08), 0 1px 2px 0 rgba(31, 35, 40, 0.04)",
        "card-hover": "0 4px 12px 0 rgba(31, 35, 40, 0.12), 0 1px 3px 0 rgba(31, 35, 40, 0.08)",
        flyout: "0 8px 24px rgba(140, 149, 159, 0.2)"
      }
    },
  },
  plugins: [],
}

