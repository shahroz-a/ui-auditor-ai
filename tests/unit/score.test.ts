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
    confidence: 0.98,
    scoreImpact: 34,
    region: {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      label: "Full viewport"
    },
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
    confidence: 0.74,
    scoreImpact: 7,
    region: {
      x: 0.1,
      y: 0.1,
      width: 0.8,
      height: 0.7,
      label: "Text rendering area"
    },
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
