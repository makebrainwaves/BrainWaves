/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/renderer/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#007c70',
          dark: '#00635a',
          light: '#e6f2f1',
        },
        accent: {
          DEFAULT: '#ffc107',
          light: '#ffe69c',
        },
        signal: {
          great: '#66b0a9',
          ok: '#ffcd39',
          bad: '#e06766',
          none: '#bfbfbf',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
