/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        uno: {
          green: "#009B48",
          red: "#ED1C24",
          blue: "#0055A5",
          yellow: "#FFDE00",
          black: "#1E1E1E",
          darkred: "#B31317",
          darkgreen: "#007A33",
          darkblue: "#003D7A",
          darkyellow: "#D9B800"
        }
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        card: "0 8px 24px -4px rgba(0, 0, 0, 0.45), 0 4px 8px -2px rgba(0, 0, 0, 0.3)",
        cardHover: "0 16px 32px -4px rgba(0, 0, 0, 0.55), 0 8px 16px -2px rgba(0, 0, 0, 0.35)",
        glow: "0 0 25px rgba(255, 255, 255, 0.6)"
      }
    },
  },
  plugins: [],
}
