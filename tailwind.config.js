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
        ink: {
          DEFAULT: '#1a1a1a',
          muted: '#666666',
          faint: '#cccccc',
        },
      },
      backgroundImage: {
        // App-wide screen background: white fading to faint lavender
        app: 'linear-gradient(to bottom, #f9f9f9, #f0f0ff)',
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
