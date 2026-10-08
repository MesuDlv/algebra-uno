/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'mobile-landscape': { 'raw': '(orientation: landscape) and (max-height: 540px)' },
        'desktop': { 'raw': '(min-width: 1024px) and (min-height: 560px)' },
      },
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
        glow: "0 0 25px rgba(255, 255, 255, 0.6)",
        felt: "inset 0 0 80px rgba(0, 0, 0, 0.7), inset 0 0 25px rgba(251, 191, 36, 0.35), 0 20px 50px rgba(0, 0, 0, 0.8)",
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'spin-reverse-slow': 'spin-reverse 12s linear infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
      },
      keyframes: {
        'spin-reverse': {
          to: { transform: 'rotate(-360deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(251, 191, 36, 0.8))' },
          '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.4))' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
    },
  },
  plugins: [],
}
