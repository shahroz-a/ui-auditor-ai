import { expect, test } from "@playwright/test";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lL+n3wAAAABJRU5ErkJggg==",
  "base64"
);

test("home screen exposes upload and report regions", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "UI Auditor AI" })).toBeVisible();
  await expect(page.getByRole("heading", { exact: true, name: "Screenshot" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "URL analysis" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Responsive viewports" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Screenshot review" })).toBeVisible();
  await expect(page.getByText("Ready for a screenshot")).toBeVisible();
});

test("audited state does not overflow at the smallest viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.goto("/");

  await page.locator('input[type="file"]').setInputFiles({
    buffer: onePixelPng,
    mimeType: "image/png",
    name: "audit.png"
  });

  await expect(page.getByRole("heading", { name: "Audit report" })).toBeVisible();

  const horizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });

  expect(horizontalOverflow).toBeLessThanOrEqual(0);
});
