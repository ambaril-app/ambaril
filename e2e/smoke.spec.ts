import { test, expect } from "@playwright/test";

/**
 * Smoke E2E tests — verify the app boots and critical pages render.
 *
 * These are NOT module-level tests. They prove the app shell is alive.
 * Run: pnpm test:e2e:smoke
 */

test.describe("App smoke", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    // Wait for React to hydrate and render any visible content
    // The login page is "use client" — initial HTML may be empty
    await page.waitForLoadState("domcontentloaded");
    // Assert the page contains the wordmark or any login-related text
    await expect(page.locator("h1, input, button").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("unauthenticated root redirects to login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/login**", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });
});
