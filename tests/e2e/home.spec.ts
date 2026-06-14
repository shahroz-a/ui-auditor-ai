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

test("long screenshot names and the issue rail stay within their columns", async ({ page }) => {
  const longScreenshotName = "Screenshot 2026-06-14 at 8.24.24 PM with an intentionally long filename.png";

  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto("/");

  await page.locator('input[type="file"]').setInputFiles({
    buffer: onePixelPng,
    mimeType: "image/png",
    name: longScreenshotName
  });

  await expect(page.getByRole("heading", { name: "Audit report" })).toBeVisible();
  const recentAudits = page.getByRole("heading", { name: "Recent audits" }).locator("xpath=ancestor::section[1]");
  await expect(recentAudits.getByText(longScreenshotName)).toBeVisible();

  const layout = await page.evaluate(() => {
    const recentTitle = Array.from(document.querySelectorAll("h2")).find((heading) => heading.textContent === "Recent audits");
    const recentCard = recentTitle?.closest("section");
    const recentItem = recentCard?.querySelector("li");
    const issueRail = document.querySelector<HTMLElement>('[aria-labelledby="issues-title"]')?.parentElement;

    function rightOverflow(container: Element | null | undefined, child: Element | null | undefined): number {
      if (!container || !child) {
        return 0;
      }

      return child.getBoundingClientRect().right - container.getBoundingClientRect().right;
    }

    return {
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      issueRailResize: issueRail ? window.getComputedStyle(issueRail).resize : "missing",
      issueRailOverflow: issueRail ? issueRail.scrollWidth - issueRail.clientWidth : 0,
      recentItemOverflow: rightOverflow(recentCard, recentItem)
    };
  });

  expect(layout.documentOverflow).toBeLessThanOrEqual(0);
  expect(layout.issueRailOverflow).toBeLessThanOrEqual(0);
  expect(layout.issueRailResize).toBe("none");
  expect(layout.recentItemOverflow).toBeLessThanOrEqual(0);
});
