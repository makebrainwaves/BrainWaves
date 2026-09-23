/** @type {import('tailwindcss').Config} */

const tokenColor = (name) =>
  `color-mix(in srgb, var(${name}) calc(<alpha-value> * 100%), transparent)`;
module.exports = {
  darkMode: ['class'],
  content: ['./src/renderer/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: tokenColor('--color-brand'),
          dark: tokenColor('--color-brand-dark'),
          light: tokenColor('--color-brand-light'),
        },
        accent: {
          DEFAULT: tokenColor('--color-accent'),
          light: tokenColor('--color-accent-light'),
        },
        signal: {
          great: tokenColor('--color-signal-great'),
          ok: tokenColor('--color-signal-ok'),
          bad: tokenColor('--color-signal-bad'),
          none: tokenColor('--color-signal-none'),
        },
        ink: {
          DEFAULT: tokenColor('--color-ink'),
          muted: tokenColor('--color-ink-muted'),
          faint: tokenColor('--color-ink-faint'),
        },
      },
      backgroundImage: {
        // App-wide screen background: white fading to faint lavender
        app: 'linear-gradient(to bottom, #f9f9f9, #f0f0ff)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
      },
      borderRadius: {
        lg: 'var(--radius-card)',
        md: 'var(--radius-control)',
        sm: 'calc(var(--radius-control) - 2px)',
      },
    },
  },
  plugins: [],
};
