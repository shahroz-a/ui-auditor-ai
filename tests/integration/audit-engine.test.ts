import { describe, expect, it } from "vitest";

import { analyzeImage } from "@/engine/audit-engine";

describe("audit engine", () => {
  it("passes a clean desktop PNG screenshot", () => {
    const report = analyzeImage(
      {
        name: "dashboard.png",
        size: 900_000,
        type: "image/png",
        width: 1440,
        height: 1024
      },
      "2026-01-01T00:00:00.000Z"
    );

    expect(report.id).toMatch(/^audit_/);
    expect(report.summary.totalFindings).toBe(0);
    expect(report.scores.overall).toBe(100);
    expect(report.checks.every((check) => check.status === "pass")).toBe(true);
  });

  it("flags low-resolution mobile captures", () => {
    const report = analyzeImage(
      {
        name: "tiny.jpg",
        size: 80_000,
        type: "image/jpeg",
        width: 300,
        height: 420
      },
      "2026-01-01T00:00:00.000Z"
    );

    expect(report.summary.critical).toBe(1);
    expect(report.summary.major).toBeGreaterThanOrEqual(2);
    expect(report.findings.map((finding) => finding.ruleId)).toContain("accessibility.viewport-minimum");
    expect(report.scores.overall).toBeLessThan(75);
  });
});
