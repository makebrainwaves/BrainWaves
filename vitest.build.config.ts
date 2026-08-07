import { defineConfig } from 'vitest/config';

// tests/build.check.ts is deliberately not named *.test.ts, so the default
// `npm test` glob never picks it up (running it without a build should be a
// loud error, not a silent skip). A CLI positional is only a filter against
// `include`, so pointing at the file directly finds nothing — this config
// supplies the include. No exclude anywhere; the filename does that job.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/build.check.ts'],
  },
});
