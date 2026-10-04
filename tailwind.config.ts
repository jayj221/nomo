import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // semantic names the screens already use, repointed at the brand
        bg: "#070608",
        card: "#1c100c",
        line: "rgba(255,214,190,0.14)",
        "line-strong": "rgba(255,214,190,0.27)",
        fg: "rgba(255,246,240,0.95)",
        secondary: "rgba(255,240,232,0.68)",
        faint: "rgba(255,236,226,0.42)",
        // `good` is the reveal green and is EARNED: it may only appear at the
        // moment two people connect. Never a success toast, never an icon.
        good: "#1fae82",
        bad: "#d4483b",
        // brand ramp, for the few places that need a specific warm tone
        rust: "#5a2617",
        amber: "#8f4c27",
        sand: "#b8794b",
        gold: "#d8a874",
      },
      borderRadius: {
        card: "16px",
        btn: "12px",
      },
      fontFamily: {
        // three roles, never mixed: sans is interface, serif is what a person
        // says or feels, mono is what the system says
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        serif: [
          "'Iowan Old Style'",
          "'Palatino Linotype'",
          "Palatino",
          "Georgia",
          "serif",
        ],
        mono: ["ui-monospace", "'SF Mono'", "Menlo", "Consolas", "monospace"],
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        rise: "rise 0.5s cubic-bezier(.2,.8,.2,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
