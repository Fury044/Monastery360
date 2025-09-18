/******** Tailwind CSS Config (CommonJS) ********/
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#111827",
        primary: {
          DEFAULT: "#0ea5e9",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f3f4f6",
          foreground: "#111827",
        },
        muted: "#f3f4f6",
        accent: "#eef2ff",
        ring: "#60a5fa",
        destructive: "#ef4444",
        input: "#e5e7eb",
      },
    },
  },
  plugins: [],
};
