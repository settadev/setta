import containerQueries from "@tailwindcss/container-queries";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        setta: {
          50: "hsl(222, 28%, 95%)",
          100: "hsl(219, 24%, 89%)",
          200: "hsl(219, 25%, 77%)",
          300: "hsl(220, 25%, 67%)",
          400: "hsl(220, 26%, 57%)",
          500: "hsl(220, 25%, 45%)",
          600: "hsl(219, 25%, 34%)",
          700: "hsl(219, 26%, 23%)",
          800: "hsl(220, 26%, 14%)",
          850: "hsl(220, 25%, 11%)",
          860: "hsl(220, 25%, 8.5%)",
          875: "hsl(220, 25%, 7.5%)",
          900: "hsl(220, 27%, 6%)",
          925: "hsl(220, 24%, 4.5%)",
          950: "hsl(220, 25%, 3%)",
          975: "hsl(220, 33%, 0.5%)",
          light: "#94a3b8",
          dark: "hsl(220, 27%, 15%)",
        },
      },
      fontFamily: {
        heading: ["Work Sans", "sans-serif"],
        // fancy: ["Cormorant Garamond", "serif"],
      },
      keyframes: {
        dash: {
          to: { backgroundPosition: "100% 0%, 0% 100%, 0% 0%, 100% 100%" },
        },
        slideDown: {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        slideUp: {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "slow-dash": "dash 40s linear infinite",
        slideDown: "slideDown 200ms cubic-bezier(0.87, 0, 0.13, 1)",
        slideUp: "slideUp 200ms cubic-bezier(0.87, 0, 0.13, 1)",
      },
    },
  },
  plugins: [typography, containerQueries],
};
