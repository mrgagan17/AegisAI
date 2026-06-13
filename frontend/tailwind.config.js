/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f6fe',
          100: '#e9edfc',
          200: '#ccd5f8',
          300: '#9fb1f2',
          400: '#6c84ea',
          500: '#465de1',
          600: '#2f41cb',
          700: '#2631a7',
          800: '#222c89',
          900: '#212972',
          950: '#141846',
        },
        dark: {
          50: '#f6f6f7',
          100: '#e1e2e5',
          200: '#c2c5cb',
          300: '#9ca1aa',
          400: '#757b85',
          500: '#5c616a',
          600: '#484c54',
          700: '#3c3e44',
          800: '#282a2e',
          900: '#1a1b1e',
          950: '#0f1011',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
