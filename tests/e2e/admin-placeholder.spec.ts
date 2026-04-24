import { expect, test } from "@playwright/test";

test.describe("core business placeholders", () => {
  test("admin module placeholder explains upcoming ERP flow", async ({
    page,
  }) => {
    await page.goto("/admin/erp");

    await expect(page.getByRole("heading", { name: "ERP" })).toBeVisible();
    await expect(
      page.getByText(/módulo estará disponível em breve/i),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Voltar ao início" }),
    ).toBeVisible();
  });
});
