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

  await expect(page.getByRole("heading", { name: "Audit report" })).toBeVisible({ timeout: 10_000 });

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

  await expect(page.getByRole("heading", { name: "Audit report" })).toBeVisible({ timeout: 10_000 });
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

test("annotated preview shows selected issue callout with fix context", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");

  await page.locator('input[type="file"]').setInputFiles({
    buffer: onePixelPng,
    mimeType: "image/png",
    name: "audit-callout.png"
  });

  await expect(page.getByRole("heading", { name: "Audit report" })).toBeVisible({ timeout: 10_000 });

  const review = page.locator('[aria-labelledby="workspace-title"]');
  const callout = review.getByTestId("selected-finding-callout");
  await expect(review.getByRole("button", { name: /Focus issue 1:/ }).first()).toBeVisible();
  await expect(callout.getByText("Full viewport", { exact: true })).toBeVisible();
  await expect(callout.getByText("Audit a full viewport capture at 320px wide or larger.")).toBeVisible();
  await expect(callout.getByRole("button", { name: "Previous bug" })).toBeVisible();
  await expect(callout.getByRole("button", { name: "Next bug" })).toBeVisible();

  const frame = review.getByTestId("screenshot-preview-frame");
  await callout.getByRole("button", { name: "Next bug" }).click();
  await expect(frame).toHaveAttribute("data-zoomed", "true");
  await expect(review.getByRole("button", { name: "Zoom out" })).toBeVisible();

  const calloutBounds = await page.evaluate(() => {
    const frameElement = document.querySelector<HTMLElement>('[data-testid="screenshot-preview-frame"]');
    const calloutElement = document.querySelector<HTMLElement>('[data-testid="selected-finding-callout"]');

    if (!frameElement || !calloutElement) {
      return null;
    }

    const frameRect = frameElement.getBoundingClientRect();
    const calloutRect = calloutElement.getBoundingClientRect();

    return {
      bottomGap: frameRect.bottom - calloutRect.bottom,
      overflowY: window.getComputedStyle(calloutElement).overflowY,
      topGap: calloutRect.top - frameRect.top
    };
  });

  expect(calloutBounds).not.toBeNull();
  expect(calloutBounds?.topGap ?? -1).toBeGreaterThanOrEqual(-1);
  expect(calloutBounds?.bottomGap ?? -1).toBeGreaterThanOrEqual(-1);
  expect(calloutBounds?.overflowY).toBe("auto");

  await review.getByRole("button", { name: "Zoom out" }).click();
  await expect(frame).toHaveAttribute("data-zoomed", "false");
  await expect(review.getByRole("button", { exact: true, name: "Focus issue" })).toBeVisible();

  await review.getByRole("button", { exact: true, name: "Focus issue" }).click();
  await expect(frame).toHaveAttribute("data-zoomed", "true");
});

test("desktop side rails match the middle column height", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop-only rail behavior.");

  await page.addInitScript(() => {
    const history = Array.from({ length: 5 }, (_, index) => ({
      createdAt: new Date(Date.UTC(2026, 5, 14, 12, index)).toISOString(),
      findings: index + 1,
      id: `seeded-history-${index}`,
      imageName: `Screenshot 2026-06-14 repeated history item ${index + 1} with a long descriptive name.png`,
      score: 88 - index,
      viewport: "1440px"
    }));

    window.localStorage.setItem("ui-auditor-ai-history", JSON.stringify(history));
  });

  await page.setViewportSize({ width: 1440, height: 760 });
  await page.goto("/");

  await page.locator('input[type="file"]').setInputFiles({
    buffer: onePixelPng,
    mimeType: "image/png",
    name: "audit-rail-height.png"
  });

  await expect(page.getByRole("heading", { name: "Audit report" })).toBeVisible({ timeout: 10_000 });
  await page.waitForFunction(() => {
    const leftRail = document.querySelector<HTMLElement>('[data-testid="audit-left-rail"]');
    const middleColumn = document.querySelector<HTMLElement>('[data-testid="audit-middle-column"]');
    const issueRail = document.querySelector<HTMLElement>('[data-testid="audit-issue-rail"]');

    if (!leftRail || !middleColumn || !issueRail) {
      return false;
    }

    const middleHeight = middleColumn.getBoundingClientRect().height;
    return (
      middleHeight > 0 &&
      Math.abs(leftRail.getBoundingClientRect().height - middleHeight) <= 2 &&
      Math.abs(issueRail.getBoundingClientRect().height - middleHeight) <= 2
    );
  });

  const layout = await page.evaluate(() => {
    const leftRail = document.querySelector<HTMLElement>('[data-testid="audit-left-rail"]');
    const middleColumn = document.querySelector<HTMLElement>('[data-testid="audit-middle-column"]');
    const issueRail = document.querySelector<HTMLElement>('[data-testid="audit-issue-rail"]');

    if (!leftRail || !middleColumn || !issueRail) {
      return null;
    }

    return {
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      issueRailHeight: issueRail.getBoundingClientRect().height,
      issueRailOverflowY: window.getComputedStyle(issueRail).overflowY,
      issueRailScrollDelta: issueRail.scrollHeight - issueRail.clientHeight,
      leftRailHeight: leftRail.getBoundingClientRect().height,
      leftRailOverflowY: window.getComputedStyle(leftRail).overflowY,
      leftRailScrollDelta: leftRail.scrollHeight - leftRail.clientHeight,
      middleColumnHeight: middleColumn.getBoundingClientRect().height
    };
  });

  expect(layout).not.toBeNull();
  expect(layout?.documentOverflow).toBeLessThanOrEqual(0);
  expect(Math.abs((layout?.leftRailHeight ?? 0) - (layout?.middleColumnHeight ?? 0))).toBeLessThanOrEqual(2);
  expect(Math.abs((layout?.issueRailHeight ?? 0) - (layout?.middleColumnHeight ?? 0))).toBeLessThanOrEqual(2);
  expect(layout?.leftRailOverflowY).toBe("auto");
  expect(layout?.issueRailOverflowY).toBe("auto");
  expect(layout?.issueRailScrollDelta).toBeGreaterThan(0);
});
