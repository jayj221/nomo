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
        bg: "#0a0a0a",
        card: "#111111",
        line: "rgba(255,255,255,0.08)",
        fg: "rgba(255,255,255,0.85)",
        secondary: "rgba(255,255,255,0.4)",
        faint: "rgba(255,255,255,0.25)",
        good: "#1D9E75",
        bad: "#E24B4A",
      },
      borderRadius: {
        card: "10px",
        btn: "6px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "sans-serif",
        ],
        serif: ["Georgia", "'Times New Roman'", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
