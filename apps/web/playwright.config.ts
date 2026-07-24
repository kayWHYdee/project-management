import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end smoke test. Runs against an already-running stack (Docker or dev
 * servers) at E2E_BASE_URL. Signs in with the bootstrap owner.
 *
 *   E2E_BASE_URL=http://localhost \
 *   E2E_OWNER_EMAIL=owner@example.com \
 *   E2E_OWNER_PASSWORD=... \
 *   pnpm --filter @water-pm/web e2e
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
