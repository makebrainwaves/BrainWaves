import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    // Sibling git worktrees carry their own node_modules and duplicate every
    // test file; collecting them breaks `npm test` with cross-copy React.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.worktrees/**'],
  },
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      path: 'pathe',
      events: 'events',
    },
  },
});
