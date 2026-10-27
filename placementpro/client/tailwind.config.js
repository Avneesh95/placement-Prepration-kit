export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Figtree Variable"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Sky Blue
          600: '#0284c7', // Primary Sky Blue
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Vibrant Orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        navy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#18181b',
          900: '#000000', // Pure Pitch Black
          950: '#09090b',
        },
        surface: {
          light: '#f0f6ff', // Sky Blue + White ambient light canvas
          card: '#ffffff',
          dark: '#000000', // Pure Black background for dark theme
          darkCard: '#0f0f11', // High-contrast elevated dark card
          darkSidebar: '#09090b', // Ultra-dark sleek sidebar
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        accent: {
          50: '#fff7ed',
          400: '#fb923c',
          500: '#f97316', // Orange
          600: '#ea580c',
        },
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        card: '0 2px 8px -2px rgb(14 165 233 / 0.08), 0 1px 3px 0 rgb(0 0 0 / 0.05)',
        hover: '0 12px 24px -4px rgb(14 165 233 / 0.12), 0 4px 8px -2px rgb(0 0 0 / 0.05)',
        glowSky: '0 0 25px -5px rgb(14 165 233 / 0.4)',
        glowOrange: '0 0 25px -5px rgb(249 115 22 / 0.4)',
      },
    },
  },
  plugins: [],
};
