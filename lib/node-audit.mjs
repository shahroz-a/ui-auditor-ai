import { readFile } from "node:fs/promises";
import path from "node:path";

const categories = [
  "accessibility",
  "components",
  "spacing",
  "typography",
  "layout",
  "quality",
  "responsive",
  "performance"
];

const categoryWeights = {
  accessibility: 1.5,
  components: 0.9,
  spacing: 1,
  typography: 1,
  layout: 1,
  quality: 0.8,
  responsive: 1.2,
  performance: 0.85
};

const severityPenalties = {
  info: 2,
  minor: 7,
  major: 16,
  critical: 34
};

const supportedWidths = [320, 375, 390, 414, 768, 1024, 1280, 1440, 1920, 2560, 3840];
const mobileWidths = [320, 375, 390, 414];

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function summarizeFindings(findings) {
  return findings.reduce(
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

function calculateCategoryScore(findings, category) {
  const penalty = findings
    .filter((finding) => finding.category === category)
    .reduce((total, finding) => {
      return total + (finding.scoreImpact || severityPenalties[finding.severity]) * categoryWeights[category];
    }, 0);

  return clampScore(100 - penalty);
}

function calculateScoreBreakdown(findings) {
  const categoryScores = categories.reduce(
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

function distanceFromSupportedWidth(width) {
  return Math.min(...supportedWidths.map((supportedWidth) => Math.abs(supportedWidth - width)));
}

function finding({
  id,
  ruleId,
  category,
  severity,
  status = "warning",
  confidence,
  scoreImpact,
  region,
  title,
  description,
  recommendation
}) {
  return {
    id,
    ruleId,
    category,
    severity,
    status,
    confidence,
    scoreImpact,
    region,
    title,
    description,
    recommendation
  };
}

const metadataRules = [
  {
    id: "accessibility.viewport-minimum",
    title: "Minimum viewport coverage",
    category: "accessibility",
    evaluate: ({ image }) => {
      if (image.width >= 320 && image.height >= 480) {
        return [];
      }

      return [
        finding({
          id: "accessibility.viewport-minimum.too-small",
          ruleId: "accessibility.viewport-minimum",
          category: "accessibility",
          severity: "critical",
          status: "fail",
          confidence: 0.98,
          scoreImpact: 34,
          region: { x: 0, y: 0, width: 1, height: 1, label: "Full viewport" },
          title: "Screenshot is below the smallest supported viewport",
          description: "The capture is smaller than 320 by 480 pixels, so touch targets and text scale cannot be reviewed reliably.",
          recommendation: "Capture the same UI at 320px wide or larger before asking an LLM to fix visual regressions."
        })
      ];
    }
  },
  {
    id: "accessibility.touch-target-context",
    title: "Touch target context",
    category: "accessibility",
    evaluate: ({ image }) => {
      if (image.width >= 375) {
        return [];
      }

      return [
        finding({
          id: "accessibility.touch-target-context.narrow",
          ruleId: "accessibility.touch-target-context",
          category: "accessibility",
          severity: "major",
          confidence: 0.78,
          scoreImpact: 16,
          region: { x: 0.04, y: 0.68, width: 0.92, height: 0.24, label: "Primary action area" },
          title: "Mobile touch targets need a narrow-screen review",
          description: "The screenshot is narrower than the common 375px mobile viewport, which can hide clipped controls or crowded actions.",
          recommendation: "Ask the coding agent to inspect mobile button, input, and sticky action layouts at 320px, 375px, and 390px."
        })
      ];
    }
  },
  {
    id: "responsive.capture-match",
    title: "Viewport capture match",
    category: "responsive",
    evaluate: ({ image, viewport }) => {
      const differenceRatio = Math.abs(image.width - viewport.width) / Math.max(viewport.width, 1);

      if (differenceRatio <= 0.18) {
        return [];
      }

      const selectedMobile = mobileWidths.includes(viewport.width);

      return [
        finding({
          id: "responsive.capture-match.mismatch",
          ruleId: "responsive.capture-match",
          category: "responsive",
          severity: selectedMobile ? "major" : "minor",
          confidence: selectedMobile ? 0.82 : 0.7,
          scoreImpact: selectedMobile ? 15 : 7,
          region: { x: 0.03, y: 0.03, width: 0.94, height: 0.94, label: `${viewport.label} comparison` },
          title: "Selected viewport does not match this capture",
          description: `The screenshot is ${image.width}px wide, but the requested review viewport is ${viewport.width}px.`,
          recommendation: "Use a screenshot captured at the same viewport width, or ask the agent to reproduce the page at that width before patching."
        })
      ];
    }
  },
  {
    id: "spacing.viewport-grid",
    title: "Responsive breakpoint coverage",
    category: "spacing",
    evaluate: ({ image }) => {
      if (distanceFromSupportedWidth(image.width) <= 16) {
        return [];
      }

      return [
        finding({
          id: "spacing.viewport-grid.unusual-width",
          ruleId: "spacing.viewport-grid",
          category: "spacing",
          severity: "minor",
          confidence: 0.84,
          scoreImpact: 7,
          region: { x: 0.02, y: 0.02, width: 0.96, height: 0.96, label: "Viewport frame" },
          title: "Screenshot width is outside common review breakpoints",
          description: "The capture does not closely match common viewport sizes, so spacing decisions may not represent a real device class.",
          recommendation: "Run companion audits at 320, 375, 390, 414, 768, 1024, 1280, and 1440px before finalizing layout fixes."
        })
      ];
    }
  },
  {
    id: "spacing.aspect-ratio",
    title: "Layout aspect ratio",
    category: "layout",
    evaluate: ({ image }) => {
      const ratio = image.width / image.height;
      if (ratio >= 0.42 && ratio <= 2.4) {
        return [];
      }

      return [
        finding({
          id: "spacing.aspect-ratio.extreme",
          ruleId: "spacing.aspect-ratio",
          category: "layout",
          severity: "major",
          confidence: 0.86,
          scoreImpact: 16,
          region: { x: 0.04, y: 0.04, width: 0.92, height: 0.92, label: "Capture bounds" },
          title: "Capture has an extreme aspect ratio",
          description: "Very tall or very wide captures often hide sticky navigation, modals, and overflow behavior.",
          recommendation: "Ask the agent to check sticky headers, sidebars, and modals in a normal viewport screenshot before making layout changes."
        })
      ];
    }
  },
  {
    id: "typography.pixel-density",
    title: "Text review resolution",
    category: "typography",
    evaluate: ({ image }) => {
      const megapixels = (image.width * image.height) / 1_000_000;
      if (megapixels >= 0.35) {
        return [];
      }

      return [
        finding({
          id: "typography.pixel-density.low",
          ruleId: "typography.pixel-density",
          category: "typography",
          severity: "major",
          confidence: 0.9,
          scoreImpact: 16,
          region: { x: 0.08, y: 0.12, width: 0.84, height: 0.72, label: "Text review area" },
          title: "Resolution is too low for typography review",
          description: "Small screenshots make text weight, truncation, and line-height issues hard to detect.",
          recommendation: "Capture a higher-resolution screenshot before asking an LLM to alter typography or text wrapping."
        })
      ];
    }
  },
  {
    id: "typography.lossy-format",
    title: "Text compression artifacts",
    category: "typography",
    evaluate: ({ image }) => {
      if (image.type !== "image/jpeg") {
        return [];
      }

      return [
        finding({
          id: "typography.lossy-format.jpeg",
          ruleId: "typography.lossy-format",
          category: "typography",
          severity: "minor",
          confidence: 0.74,
          scoreImpact: 7,
          region: { x: 0.1, y: 0.1, width: 0.8, height: 0.7, label: "Text rendering area" },
          title: "JPEG compression can soften interface text",
          description: "Lossy compression may blur small labels, icons, and dense table text.",
          recommendation: "Prefer PNG or WebP screenshots when using LLM agents to diagnose typography or contrast defects."
        })
      ];
    }
  }
];

function statusForFindings(findings) {
  if (findings.some((item) => item.status === "fail")) {
    return "fail";
  }

  if (findings.length > 0) {
    return "warning";
  }

  return "pass";
}

function readUInt24LE(buffer, offset) {
  return buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16);
}

function parsePng(buffer) {
  if (buffer.length < 24 || buffer.toString("hex", 0, 8) !== "89504e470d0a1a0a") {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    type: "image/png"
  };
}

function parseJpeg(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    offset += 2;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    const length = buffer.readUInt16BE(offset);
    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isStartOfFrame) {
      return {
        width: buffer.readUInt16BE(offset + 5),
        height: buffer.readUInt16BE(offset + 3),
        type: "image/jpeg"
      };
    }

    offset += length;
  }

  return null;
}

function parseWebp(buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;

    if (chunkType === "VP8X" && dataOffset + 10 <= buffer.length) {
      return {
        width: readUInt24LE(buffer, dataOffset + 4) + 1,
        height: readUInt24LE(buffer, dataOffset + 7) + 1,
        type: "image/webp"
      };
    }

    if (chunkType === "VP8 " && dataOffset + 10 <= buffer.length) {
      return {
        width: buffer.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: buffer.readUInt16LE(dataOffset + 8) & 0x3fff,
        type: "image/webp"
      };
    }

    if (chunkType === "VP8L" && dataOffset + 5 <= buffer.length && buffer[dataOffset] === 0x2f) {
      const b1 = buffer[dataOffset + 1];
      const b2 = buffer[dataOffset + 2];
      const b3 = buffer[dataOffset + 3];
      const b4 = buffer[dataOffset + 4];

      return {
        width: 1 + (((b2 & 0x3f) << 8) | b1),
        height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)),
        type: "image/webp"
      };
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  return null;
}

function parseAvif(buffer) {
  if (buffer.length < 32 || buffer.toString("ascii", 4, 8) !== "ftyp") {
    return null;
  }

  const brandBlock = buffer.toString("ascii", 8, Math.min(buffer.length, 40));
  if (!brandBlock.includes("avif") && !brandBlock.includes("avis")) {
    return null;
  }

  const marker = Buffer.from("ispe", "ascii");
  let offset = buffer.indexOf(marker);
  while (offset !== -1 && offset + 16 <= buffer.length) {
    const boxStart = offset - 4;
    const boxSize = boxStart >= 0 ? buffer.readUInt32BE(boxStart) : 0;
    const width = buffer.readUInt32BE(offset + 8);
    const height = buffer.readUInt32BE(offset + 12);

    if (boxSize >= 20 && width > 0 && height > 0) {
      return {
        width,
        height,
        type: "image/avif"
      };
    }

    offset = buffer.indexOf(marker, offset + 4);
  }

  return null;
}

export async function readImageMetadata(filePath) {
  const buffer = await readFile(filePath);
  const parsed = parsePng(buffer) ?? parseJpeg(buffer) ?? parseWebp(buffer) ?? parseAvif(buffer);

  if (!parsed) {
    throw new Error("Unsupported or unreadable image. Supported formats: PNG, JPEG, WebP, AVIF.");
  }

  return {
    name: path.basename(filePath),
    size: buffer.byteLength,
    lastModified: undefined,
    ...parsed
  };
}

function viewportForWidth(width, image) {
  return {
    width,
    height: Math.max(1, Math.round(width * (image.height / image.width))),
    label: `${width}px`,
    source: supportedWidths.includes(width) ? "estimated" : "custom"
  };
}

function uploadedViewportForImage(image) {
  return {
    width: image.width,
    height: image.height,
    label: `${image.width}px upload`,
    source: "uploaded"
  };
}

function buildAgentHints(report) {
  const sortedFindings = report.findings.slice().sort((first, second) => second.scoreImpact - first.scoreImpact);
  const priorities = sortedFindings.slice(0, 5).map((item) => ({
    severity: item.severity,
    category: item.category,
    title: item.title,
    recommendation: item.recommendation,
    region: item.region
  }));

  return {
    mode: "metadata-only",
    limitation:
      "Node CLI/MCP mode is metadata-only: it reads local image dimensions and format only. Use the browser UI for pixel-sampled contrast, density, and overlay review.",
    suggestedAgentTask:
      priorities.length > 0
        ? "Inspect the affected UI at the requested viewport, reproduce the issue in the product code, patch responsive/layout styles, then rerun this audit."
        : "No metadata issues were found. For visual regressions, run the browser UI or add Playwright screenshots for pixel-aware review.",
    priorities
  };
}

export function analyzeImageMetadata(image, options = {}) {
  const createdAt = options.createdAt ?? new Date().toISOString();
  const viewport = options.viewportWidth ? viewportForWidth(Number(options.viewportWidth), image) : uploadedViewportForImage(image);
  const context = { image, viewport };
  const findings = metadataRules.flatMap((rule) => rule.evaluate(context));
  const checks = metadataRules.map((rule) => {
    const ruleFindings = findings.filter((item) => item.ruleId === rule.id);

    return {
      ruleId: rule.id,
      title: rule.title,
      category: rule.category,
      status: statusForFindings(ruleFindings)
    };
  });
  const report = {
    id: `audit_${hashString(`${image.name}:${image.width}:${image.height}:${image.size}:${viewport.width}`)}`,
    createdAt,
    mode: "node-metadata",
    image,
    viewport,
    summary: summarizeFindings(findings),
    checks,
    findings,
    scores: calculateScoreBreakdown(findings)
  };

  return {
    ...report,
    agentHints: buildAgentHints(report)
  };
}

export async function auditScreenshot(filePath, options = {}) {
  const image = await readImageMetadata(filePath);
  return analyzeImageMetadata(image, options);
}

export function formatReportAsMarkdown(report) {
  const findings = report.findings
    .slice()
    .sort((first, second) => second.scoreImpact - first.scoreImpact)
    .map((item, index) => {
      return [
        `${index + 1}. **${item.title}** (${item.severity}, ${item.category}, confidence ${Math.round(item.confidence * 100)}%)`,
        `   - ${item.description}`,
        `   - Fix: ${item.recommendation}`,
        `   - Region: ${item.region.label} (${Math.round(item.region.x * 100)}%, ${Math.round(item.region.y * 100)}%, ${Math.round(item.region.width * 100)}%, ${Math.round(item.region.height * 100)}%)`
      ].join("\n");
    })
    .join("\n");

  return `# UI Auditor AI Report

- Image: ${report.image.name}
- Dimensions: ${report.image.width}x${report.image.height}
- Viewport: ${report.viewport.label}
- Mode: ${report.mode}
- Overall score: ${report.scores.overall}/100
- Findings: ${report.summary.totalFindings}

## Findings

${findings || "No metadata findings."}

## LLM Handoff

${report.agentHints.limitation}

Task for a coding agent:
${report.agentHints.suggestedAgentTask}
`;
}

export function formatReport(report, format = "json") {
  if (format === "markdown") {
    return formatReportAsMarkdown(report);
  }

  return JSON.stringify(report, null, 2);
}
