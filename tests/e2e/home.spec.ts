import { expect, test } from "@playwright/test";

test("home screen exposes upload and report regions", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "UI Auditor AI" })).toBeVisible();
  await expect(page.getByRole("heading", { exact: true, name: "Screenshot" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "URL analysis" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Responsive viewports" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Screenshot review" })).toBeVisible();
  await expect(page.getByText("Ready for a screenshot")).toBeVisible();
});
