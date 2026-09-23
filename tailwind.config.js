/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gs: {
          dark: '#08090C',
          card: '#111218',
          raised: '#181A22',
          border: '#232634',
          'border-glow': '#EE1D36',
          primary: '#EE1D36',
          'primary-glow': '#FF2E4D',
          'primary-dark': '#B91227',
          light: '#F8FAFC',
          muted: '#94A3B8',
          success: '#10B981',
          warning: '#F59E0B',
          mythic: '#A855F7',
          cyan: '#06B6D4',
        }
      },
      fontFamily: {
        heading: ['"Chakra Petch"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        chakra: ['"Chakra Petch"', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -3px rgba(238, 29, 54, 0.45)',
        'glow-primary-lg': '0 0 35px 2px rgba(238, 29, 54, 0.55)',
        'glow-mythic': '0 0 20px -3px rgba(168, 85, 247, 0.45)',
        'glow-success': '0 0 20px -3px rgba(16, 185, 129, 0.45)',
        'card-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(238, 29, 54, 0.6))' },
          '50%': { opacity: '0.7', filter: 'drop-shadow(0 0 5px rgba(238, 29, 54, 0.3))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
