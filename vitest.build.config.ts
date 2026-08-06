import { defineConfig } from 'vitest/config';

// Build-artifact checks (tests/build.test.ts) assert against `out/` and the
// postinstall-downloaded Pyodide payload, so they only mean anything after
// `npm run build`. They live in their own config — and are excluded from the
// default `npm test` run — so that running them without a build is a loud
// failure rather than a silently skipped test.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/build.test.ts'],
  },
});
