import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("app loads without errors", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Ambaril/i);
  });
});

test.describe("Auth Flow", () => {
  test("unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/app/dashboard");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Multi-Tenant Isolation", () => {
  test.skip("tenant A cannot access tenant B data", async ({ page }) => {
    // TODO: Implement after auth seeding is set up
    // This test MUST be implemented before any module goes to production
  });
});
