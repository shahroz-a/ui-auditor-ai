import { rules } from "@/rules";
import type {
  AuditFinding,
  AuditReport,
  AuditStatus,
  AuditViewport,
  ImageMetadata,
  VisualMetrics
} from "@/types/audit";
import { calculateScoreBreakdown, summarizeFindings } from "@/engine/score";

function hashString(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

function statusForFindings(findings: AuditFinding[]): AuditStatus {
  if (findings.some((finding) => finding.status === "fail")) {
    return "fail";
  }

  if (findings.length > 0) {
    return "warning";
  }

  return "pass";
}

export interface AnalyzeImageOptions {
  metrics?: VisualMetrics;
  viewport?: AuditViewport;
}

function uploadedViewportForImage(image: ImageMetadata): AuditViewport {
  return {
    width: image.width,
    height: image.height,
    label: `${image.width}px upload`,
    source: "uploaded"
  };
}

export function analyzeImage(
  image: ImageMetadata,
  createdAt = new Date().toISOString(),
  options: AnalyzeImageOptions = {}
): AuditReport {
  const viewport = options.viewport ?? uploadedViewportForImage(image);
  const findings = rules.flatMap((rule) =>
    rule.evaluate({
      image,
      metrics: options.metrics,
      viewport
    })
  );
  const checks = rules.map((rule) => {
    const ruleFindings = findings.filter((finding) => finding.ruleId === rule.id);

    return {
      ruleId: rule.id,
      title: rule.title,
      category: rule.category,
      status: statusForFindings(ruleFindings)
    };
  });

  return {
    id: `audit_${hashString(`${image.name}:${image.width}:${image.height}:${image.size}:${viewport.width}`)}`,
    createdAt,
    image,
    viewport,
    metrics: options.metrics,
    summary: summarizeFindings(findings),
    checks,
    findings,
    scores: calculateScoreBreakdown(findings)
  };
}
