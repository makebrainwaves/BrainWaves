import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    // Stale git worktrees and packaged output carry their own node_modules and
    // test copies; without this, `vitest run` dies on two-React hook errors.
    exclude: [...configDefaults.exclude, '.worktrees/**', 'release/**', 'out/**'],
  },
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      path: 'pathe',
      events: 'events',
    },
  },
});
