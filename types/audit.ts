export type AuditCategory =
  | "accessibility"
  | "spacing"
  | "typography"
  | "layout"
  | "performance";

export type AuditSeverity = "info" | "minor" | "major" | "critical";

export type AuditStatus = "pass" | "warning" | "fail";

export interface ImageMetadata {
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  lastModified?: number;
}

export interface AuditFinding {
  id: string;
  ruleId: string;
  category: AuditCategory;
  severity: AuditSeverity;
  status: Exclude<AuditStatus, "pass">;
  title: string;
  description: string;
  recommendation: string;
}

export interface RuleCheck {
  ruleId: string;
  title: string;
  category: AuditCategory;
  status: AuditStatus;
}

export interface ScoreBreakdown {
  overall: number;
  accessibility: number;
  spacing: number;
  typography: number;
  layout: number;
  performance: number;
}

export interface AuditSummary {
  totalFindings: number;
  critical: number;
  major: number;
  minor: number;
  info: number;
}

export interface AuditReport {
  id: string;
  createdAt: string;
  image: ImageMetadata;
  summary: AuditSummary;
  checks: RuleCheck[];
  findings: AuditFinding[];
  scores: ScoreBreakdown;
}

export interface RuleContext {
  image: ImageMetadata;
}

export interface RuleDefinition {
  id: string;
  title: string;
  category: AuditCategory;
  evaluate: (context: RuleContext) => AuditFinding[];
}
