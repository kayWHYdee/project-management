import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Integration tests boot the real NestJS app against a throwaway Postgres
// (spun up by Testcontainers). They need Docker available and are kept separate
// from the fast, DB-free unit tests (`*.spec.ts`).
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.int-spec.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
  plugins: [swc.vite()],
});
