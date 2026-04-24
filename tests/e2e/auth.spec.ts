import { expect, test } from "@playwright/test";

test.describe("authentication flows", () => {
  test("login page loads and allows switching auth mode", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Ambaril" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();

    await page.getByRole("button", { name: "Entrar com senha" }).click();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("forgot password page loads recovery form", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(page.getByRole("heading", { name: "Ambaril" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Enviar link de redefinição" }),
    ).toBeVisible();
  });
});
