import { expect, test } from "@playwright/test";

test("home screen exposes upload and report regions", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "UI Auditor AI" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Screenshot" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Audit report" })).toBeVisible();
  await expect(page.getByText("Nothing to analyze")).toBeVisible();
});
