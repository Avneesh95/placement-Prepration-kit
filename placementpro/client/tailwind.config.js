export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    fontFamily: { sans: ['"Figtree Variable"', 'system-ui', 'sans-serif'] },
    colors: { brand: { 50: '#eef4ff', 100: '#dbe7ff', 500: '#2f6bff', 600: '#1f56e0', 700: '#1a45b8' }, accent: { 500: '#f28c28', 600: '#d9741a' } },
  } },
  plugins: [],
};
