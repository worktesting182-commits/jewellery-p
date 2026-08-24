/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        obsidian: {
          DEFAULT: "#0B0C10",
          card: "#12141C",
          surface: "#1A1D28",
          border: "#242938",
        },
        champagne: {
          50: "#FFFDF5",
          100: "#FDF8E8",
          200: "#F9EEB8",
          300: "#F3E1B9",
          400: "#E5C880",
          500: "#D4AF37", // Royal Champagne Gold
          600: "#B8860B",
          700: "#AA771C",
          800: "#7C520E",
        },
        ivory: {
          DEFAULT: "#FAFAF7",
          card: "#F4EFE6",
        },
        emeraldDeep: "#051F20",
        emeraldDark: "#0B2B26",
        forestGreen: "#163832",
        mutedForest: "#235347",
        sageGreen: "#8EB69B",
        mintLight: "#DAF1DE",
      },
      boxShadow: {
        gold: "0 0 20px rgba(212, 175, 55, 0.2)",
        "gold-lg": "0 0 35px rgba(212, 175, 55, 0.35)",
        "gold-inner": "inset 0 1px 3px rgba(212, 175, 55, 0.3)",
      },
    },
  },
  plugins: [],
}
