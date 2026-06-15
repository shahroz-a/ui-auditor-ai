export type AuditCategory =
  | "accessibility"
  | "components"
  | "spacing"
  | "typography"
  | "layout"
  | "quality"
  | "responsive"
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

export interface AuditRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface AuditViewport {
  width: number;
  height: number;
  label: string;
  source: "uploaded" | "estimated" | "custom";
}

export interface VisualHotspot {
  x: number;
  y: number;
  width: number;
  height: number;
  activity: number;
  label: string;
}

export interface VisualMetrics {
  sampleWidth: number;
  sampleHeight: number;
  averageLuminance: number;
  contrastSpread: number;
  edgeDensity: number;
  busyRegionRatio: number;
  blankEdgeRatio: number;
  edgeCrowding: number;
  horizontalBalance: number;
  verticalBalance: number;
  colorComplexity: number;
  leftActivity: number;
  rightActivity: number;
  topActivity: number;
  bottomActivity: number;
  hotspots: VisualHotspot[];
}

export interface AuditFinding {
  id: string;
  ruleId: string;
  category: AuditCategory;
  severity: AuditSeverity;
  status: Exclude<AuditStatus, "pass">;
  confidence: number;
  scoreImpact: number;
  region: AuditRegion;
  title: string;
  description: string;
  recommendation: string;
  evidence?: string[];
  fixPrompt?: string;
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
  components: number;
  spacing: number;
  typography: number;
  layout: number;
  quality: number;
  responsive: number;
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
  viewport: AuditViewport;
  metrics?: VisualMetrics;
  summary: AuditSummary;
  checks: RuleCheck[];
  findings: AuditFinding[];
  scores: ScoreBreakdown;
}

export interface RuleContext {
  image: ImageMetadata;
  viewport: AuditViewport;
  metrics?: VisualMetrics;
}

export interface RuleDefinition {
  id: string;
  title: string;
  category: AuditCategory;
  evaluate: (context: RuleContext) => AuditFinding[];
}
