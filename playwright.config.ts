import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for Ambaril.
 *
 * Smoke tests run against the local Next.js dev server.
 * Set BASE_URL env to test against a different target (e.g., staging).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 15_000,

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "pnpm --filter @ambaril/web dev",
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
