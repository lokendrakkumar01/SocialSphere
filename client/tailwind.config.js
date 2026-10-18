/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5ff',
          100: '#e0ecff',
          200: '#b9d6fe',
          300: '#7cb5fd',
          400: '#378ff9',
          500: '#0d6efd',
          600: '#0254e4',
          700: '#0342b7',
          800: '#073794',
          900: '#0b2f76',
          950: '#071d4b',
        },
        dark: {
          bg: '#0b0f19',
          card: '#111827',
          border: '#1f2937',
          hover: '#1e293b',
          muted: '#9ca3af',
        },
      },
    },
  },
  plugins: [],
};
