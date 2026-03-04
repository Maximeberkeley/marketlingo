/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MarketLingo light theme — Brilliant-inspired
        bg: {
          0: '#FFFFFF',
          1: '#F3F4F6',
          2: '#FFFFFF',
        },
        accent: '#8B5CF6',
        text: {
          primary: '#1A1F36',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        streak: '#F97316',
        success: '#22C55E',
      },
    },
  },
  plugins: [],
};
