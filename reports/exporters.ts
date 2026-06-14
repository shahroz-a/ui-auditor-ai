import type { AuditFinding, AuditReport, AuditSeverity } from "@/types/audit";
import type { UploadedImage } from "@/types/image";

const severityColors: Record<AuditSeverity, string> = {
  critical: "#dc2626",
  major: "#ea580c",
  minor: "#ca8a04",
  info: "#2563eb"
};

function downloadBlob(filename: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string | number): string {
  const stringValue = String(value);
  if (!/[",\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replaceAll('"', '""')}"`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load screenshot for PNG export."));
    image.src = src;
  });
}

export function serializeReportAsMarkdown(report: AuditReport): string {
  const findings = report.findings
    .map(
      (finding, index) => `### ${index + 1}. ${finding.title}

- Severity: ${finding.severity}
- Category: ${finding.category}
- Confidence: ${Math.round(finding.confidence * 100)}%
- Impact: ${finding.scoreImpact}
- Region: ${finding.region.label}
- Recommendation: ${finding.recommendation}

${finding.description}`
    )
    .join("\n\n");

  return `# UI Auditor AI Report

- Audit ID: ${report.id}
- Created: ${report.createdAt}
- Screenshot: ${report.image.name}
- Viewport: ${report.viewport.label}
- Overall score: ${report.scores.overall}/100
- Findings: ${report.summary.totalFindings}

## Scores

| Category | Score |
| --- | ---: |
| Accessibility | ${report.scores.accessibility} |
| Responsive | ${report.scores.responsive} |
| Layout | ${report.scores.layout} |
| Spacing | ${report.scores.spacing} |
| Typography | ${report.scores.typography} |
| Components | ${report.scores.components} |
| Quality | ${report.scores.quality} |
| Performance | ${report.scores.performance} |

## Findings

${findings || "No findings."}
`;
}

export function serializeReportAsCsv(report: AuditReport): string {
  const rows = [
    [
      "id",
      "severity",
      "category",
      "confidence",
      "impact",
      "region",
      "title",
      "description",
      "recommendation"
    ],
    ...report.findings.map((finding) => [
      finding.id,
      finding.severity,
      finding.category,
      Math.round(finding.confidence * 100),
      finding.scoreImpact,
      finding.region.label,
      finding.title,
      finding.description,
      finding.recommendation
    ])
  ];

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export function exportReportAsJson(report: AuditReport) {
  downloadBlob(`${report.id}.json`, JSON.stringify(report, null, 2), "application/json");
}

export function exportReportAsMarkdown(report: AuditReport) {
  downloadBlob(`${report.id}.md`, serializeReportAsMarkdown(report), "text/markdown;charset=utf-8");
}

export function exportReportAsCsv(report: AuditReport) {
  downloadBlob(`${report.id}.csv`, serializeReportAsCsv(report), "text/csv;charset=utf-8");
}

export async function exportAnnotatedPng(image: UploadedImage, report: AuditReport, selectedFindingId?: string) {
  const source = await loadImage(image.previewUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  context.drawImage(source, 0, 0, image.width, image.height);
  context.lineWidth = Math.max(3, Math.round(Math.min(image.width, image.height) * 0.004));
  context.font = `${Math.max(18, Math.round(image.width * 0.018))}px system-ui, sans-serif`;
  context.textBaseline = "middle";

  report.findings.forEach((finding: AuditFinding, index) => {
    const color = severityColors[finding.severity];
    const x = finding.region.x * image.width;
    const y = finding.region.y * image.height;
    const width = finding.region.width * image.width;
    const height = finding.region.height * image.height;
    const pinSize = Math.max(28, Math.round(image.width * 0.026));
    const isSelected = finding.id === selectedFindingId;

    context.strokeStyle = color;
    context.fillStyle = `${color}${isSelected ? "33" : "22"}`;
    context.fillRect(x, y, width, height);
    context.strokeRect(x, y, width, height);
    context.fillStyle = color;
    context.beginPath();
    context.arc(x + pinSize / 2, y + pinSize / 2, pinSize / 2, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.fillText(String(index + 1), x + pinSize / 2, y + pinSize / 2);
  });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) {
    throw new Error("PNG export failed.");
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${report.id}-annotated.png`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportPrintableReport(report: AuditReport) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    throw new Error("The browser blocked the printable report window.");
  }

  const findings = report.findings
    .map(
      (finding, index) => `<article>
        <h2>${index + 1}. ${escapeHtml(finding.title)}</h2>
        <p><strong>${escapeHtml(finding.severity)}</strong> · ${escapeHtml(finding.category)} · ${Math.round(finding.confidence * 100)}% confidence</p>
        <p>${escapeHtml(finding.description)}</p>
        <p><strong>Fix:</strong> ${escapeHtml(finding.recommendation)}</p>
      </article>`
    )
    .join("");

  printWindow.document.write(`<!doctype html>
<html>
  <head>
    <title>${escapeHtml(report.id)}</title>
    <style>
      body { color: #0f172a; font-family: Inter, system-ui, sans-serif; margin: 40px; }
      header { border-bottom: 1px solid #cbd5e1; margin-bottom: 24px; padding-bottom: 16px; }
      h1 { margin: 0; }
      article { border-bottom: 1px solid #e2e8f0; padding: 18px 0; }
      .score { font-size: 42px; font-weight: 800; }
      @media print { body { margin: 24px; } }
    </style>
  </head>
  <body>
    <header>
      <h1>UI Auditor AI Report</h1>
      <p>${escapeHtml(report.image.name)} · ${escapeHtml(report.viewport.label)} · ${escapeHtml(report.createdAt)}</p>
      <p class="score">${report.scores.overall}/100</p>
    </header>
    ${findings || "<p>No findings.</p>"}
  </body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
