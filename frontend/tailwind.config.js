/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx,html,css}"],
  darkMode: "class",
  plugins: [
    require("@tailwindcss/typography"),
    function ({ addBase }) {
      addBase({
        ".dark": {
          "--colors-setta-50": "oklch(12.81% 0.007 261.32)",
          "--colors-setta-100": "oklch(16.31% 0.0125 264.14)",
          "--colors-setta-200": "oklch(24.58% 0.0254 263.94)",
          "--colors-setta-300": "oklch(33.24% 0.0381 262.51)",
          "--colors-setta-400": "oklch(43.11% 0.0508 262.49)",
          "--colors-setta-500": "oklch(52.16% 0.0651 263.76)",
          "--colors-setta-600": "oklch(62.55% 0.0618 263.97)",
          "--colors-setta-700": "oklch(71.67% 0.0439 264.25)",
          "--colors-setta-800": "oklch(80.57% 0.0292 262.95)",
          "--colors-setta-850": "oklch(21.62% 0.0198 264.03)",
          "--colors-setta-860": "oklch(19.03% 0.0158 264.09)",
          "--colors-setta-875": "oklch(17.97% 0.0141 264.13)",
          "--colors-setta-900": "oklch(90.85% 0.013 263.02)",
          "--colors-setta-925": "oklch(14.71% 0.0086 263.76)",
          "--colors-setta-950": "oklch(95.74% 0.0071 267.38)",
          "--colors-setta-975": "oklch(6.97% 0.0051 260.18)",
          "--colors-setta-light": "oklch(25.52% 0.028 263.88)",
          "--colors-setta-dark": "oklch(71.07% 0.0351 256.79)",
        },
      });
    },
  ],
  theme: {
    extend: {
      colors: {
        setta: {
          50: "var(--colors-setta-50)",
          100: "var(--colors-setta-100)",
          200: "var(--colors-setta-200)",
          300: "var(--colors-setta-300)",
          400: "var(--colors-setta-400)",
          500: "var(--colors-setta-500)",
          600: "var(--colors-setta-600)",
          700: "var(--colors-setta-700)",
          800: "var(--colors-setta-800)",
          850: "var(--colors-setta-850)",
          860: "var(--colors-setta-860)",
          875: "var(--colors-setta-875)",
          900: "var(--colors-setta-900)",
          925: "var(--colors-setta-925)",
          950: "var(--colors-setta-950)",
          975: "var(--colors-setta-975)",
          light: "var(--colors-setta-light)",
          dark: "var(--colors-setta-dark)",
        },
      },
    },
  },
};
