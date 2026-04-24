import { expect, test } from "@playwright/test";

test.describe("entry navigation", () => {
  test("root redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/");

    await page.waitForURL("**/login", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("signup page exposes workspace creation fields", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.getByRole("heading", { name: "Ambaril" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Nome da empresa")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Criar workspace" }),
    ).toBeVisible();
  });
});
