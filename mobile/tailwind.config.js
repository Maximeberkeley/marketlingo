/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MarketLingo dark theme
        bg: {
          0: '#0B1020',
          1: '#0F172A',
          2: '#111C33',
        },
        accent: '#8B5CF6',
        text: {
          primary: '#F8FAFC',
          secondary: '#CBD5E1',
          muted: '#64748B',
        },
        streak: '#F97316',
        success: '#22C55E',
      },
    },
  },
  plugins: [],
};
