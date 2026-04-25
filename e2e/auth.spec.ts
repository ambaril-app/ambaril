import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Ambaril/i);
    // Login form should be visible
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("should reject invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', "invalid@example.com");
    await page.fill('[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    // Should show error, not redirect
    await expect(page).toHaveURL(/login/);
  });

  test("should redirect unauthenticated users", async ({ page }) => {
    // Try to access admin area without auth
    await page.goto("/admin");
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});
