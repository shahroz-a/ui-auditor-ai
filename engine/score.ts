import type {
  AuditCategory,
  AuditFinding,
  AuditSeverity,
  AuditSummary,
  ScoreBreakdown
} from "@/types/audit";

const categoryWeights: Record<AuditCategory, number> = {
  accessibility: 1.5,
  components: 0.9,
  spacing: 1,
  typography: 1,
  layout: 1,
  quality: 0.8,
  responsive: 1.2,
  performance: 0.85
};

const severityPenalties: Record<AuditSeverity, number> = {
  info: 2,
  minor: 7,
  major: 16,
  critical: 34
};

const categories: AuditCategory[] = [
  "accessibility",
  "components",
  "spacing",
  "typography",
  "layout",
  "quality",
  "responsive",
  "performance"
];

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function summarizeFindings(findings: AuditFinding[]): AuditSummary {
  return findings.reduce<AuditSummary>(
    (summary, finding) => ({
      ...summary,
      totalFindings: summary.totalFindings + 1,
      [finding.severity]: summary[finding.severity] + 1
    }),
    {
      totalFindings: 0,
      critical: 0,
      major: 0,
      minor: 0,
      info: 0
    }
  );
}

export function calculateCategoryScore(
  findings: AuditFinding[],
  category: AuditCategory
): number {
  const penalty = findings
    .filter((finding) => finding.category === category)
    .reduce((total, finding) => {
      return total + (finding.scoreImpact || severityPenalties[finding.severity]) * categoryWeights[category];
    }, 0);

  return clampScore(100 - penalty);
}

export function calculateScoreBreakdown(findings: AuditFinding[]): ScoreBreakdown {
  const categoryScores = categories.reduce<Record<AuditCategory, number>>(
    (scores, category) => ({
      ...scores,
      [category]: calculateCategoryScore(findings, category)
    }),
    {
      accessibility: 100,
      components: 100,
      spacing: 100,
      typography: 100,
      layout: 100,
      quality: 100,
      responsive: 100,
      performance: 100
    }
  );

  const weightedTotal = categories.reduce((total, category) => {
    return total + categoryScores[category] * categoryWeights[category];
  }, 0);
  const totalWeight = categories.reduce((total, category) => total + categoryWeights[category], 0);
  const globalPenalty = findings.reduce((total, finding) => {
    return total + (finding.scoreImpact || severityPenalties[finding.severity]) * 0.18;
  }, 0);

  return {
    overall: clampScore(weightedTotal / totalWeight - globalPenalty),
    ...categoryScores
  };
}
