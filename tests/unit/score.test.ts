import { describe, expect, it } from "vitest";

import { calculateScoreBreakdown, summarizeFindings } from "@/engine/score";
import type { AuditFinding } from "@/types/audit";

const findings: AuditFinding[] = [
  {
    id: "one",
    ruleId: "accessibility.viewport-minimum",
    category: "accessibility",
    severity: "critical",
    status: "fail",
    title: "Too small",
    description: "The viewport is too small.",
    recommendation: "Use a supported viewport."
  },
  {
    id: "two",
    ruleId: "typography.lossy-format",
    category: "typography",
    severity: "minor",
    status: "warning",
    title: "Lossy format",
    description: "The capture uses JPEG.",
    recommendation: "Use PNG or WebP."
  }
];

describe("score calculator", () => {
  it("summarizes findings by severity", () => {
    expect(summarizeFindings(findings)).toEqual({
      totalFindings: 2,
      critical: 1,
      major: 0,
      minor: 1,
      info: 0
    });
  });

  it("keeps category and overall scores in a 0-100 range", () => {
    const scores = calculateScoreBreakdown(findings);

    expect(scores.accessibility).toBe(49);
    expect(scores.typography).toBe(93);
    expect(scores.overall).toBeGreaterThan(80);
    expect(scores.overall).toBeLessThanOrEqual(100);
  });
});
