/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // BRAND COLORS (client requirement)
        brand: {
          green: {
            DEFAULT: "#16A34A", // main green
            light: "#4ADE80",
            dark: "#15803D",
          },
          yellow: {
            DEFAULT: "#FACC15", // main yellow
            light: "#FDE047",
            dark: "#CA8A04",
          },
        },

        // ACCENT COLORS (our enhancements)
        accent: {
          blue: "#3B82F6",
          darkBlue: "#1E40AF",
        },

        // NEUTRALS
        gray: {
          soft: "#F3F4F6",
          DEFAULT: "#9CA3AF",
          dark: "#6B7280",
        },

        // TEXT COLORS
        text: {
          main: "#1F2937",
          muted: "#6B7280",
          light: "#FFFFFF",
        },

        // BACKGROUNDS
        bg: {
          light: "#FFFFFF",
          soft: "#F9FAFB",
          dark: "#111827",
        },
      },
    },
  },
  plugins: [],
};
