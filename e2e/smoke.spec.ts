import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("app loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await expect(page).toHaveTitle(/Ambaril/i);

    // No JS errors
    expect(errors).toHaveLength(0);
  });

  test("no console errors on login page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/login");
    // Allow React hydration warnings but no real errors
    const realErrors = errors.filter((e) => !e.includes("hydrat"));
    expect(realErrors).toHaveLength(0);
  });
});
