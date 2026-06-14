import type { RuleDefinition } from "@/types/audit";

const supportedWidths = [320, 375, 390, 768, 1024, 1280, 1440, 1920, 2560, 3840];

function distanceFromSupportedWidth(width: number): number {
  return Math.min(...supportedWidths.map((supportedWidth) => Math.abs(supportedWidth - width)));
}

export const spacingRules: RuleDefinition[] = [
  {
    id: "spacing.viewport-grid",
    title: "Responsive breakpoint coverage",
    category: "spacing",
    evaluate: ({ image }) => {
      if (distanceFromSupportedWidth(image.width) <= 16) {
        return [];
      }

      return [
        {
          id: "spacing.viewport-grid.unusual-width",
          ruleId: "spacing.viewport-grid",
          category: "spacing",
          severity: "minor",
          status: "warning",
          confidence: 0.84,
          scoreImpact: 7,
          region: {
            x: 0.02,
            y: 0.02,
            width: 0.96,
            height: 0.96,
            label: "Viewport frame"
          },
          title: "Screenshot width is outside common review breakpoints",
          description: "The capture does not closely match the documented viewport sizes, so spacing decisions may not represent a real device class.",
          recommendation: "Re-run the audit at 320, 375, 390, 414, 768, 1024, 1280, or 1440px widths."
        }
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
        {
          id: "spacing.aspect-ratio.extreme",
          ruleId: "spacing.aspect-ratio",
          category: "layout",
          severity: "major",
          status: "warning",
          confidence: 0.86,
          scoreImpact: 16,
          region: {
            x: 0.04,
            y: 0.04,
            width: 0.92,
            height: 0.92,
            label: "Capture bounds"
          },
          title: "Capture has an extreme aspect ratio",
          description: "Very tall or very wide captures often hide sticky navigation, modals, and overflow behavior.",
          recommendation: "Pair this capture with a normal viewport screenshot before accepting the audit."
        }
      ];
    }
  },
  {
    id: "spacing.edge-rhythm",
    title: "Edge spacing rhythm",
    category: "spacing",
    evaluate: ({ metrics }) => {
      if (!metrics || (metrics.blankEdgeRatio >= 0.06 && metrics.blankEdgeRatio <= 0.44)) {
        return [];
      }

      const crowded = metrics.blankEdgeRatio < 0.06;

      return [
        {
          id: crowded ? "spacing.edge-rhythm.crowded" : "spacing.edge-rhythm.excessive",
          ruleId: "spacing.edge-rhythm",
          category: "spacing",
          severity: crowded ? "major" : "minor",
          status: "warning",
          confidence: crowded ? 0.72 : 0.62,
          scoreImpact: crowded ? 14 : 6,
          region: {
            x: 0.02,
            y: 0.02,
            width: 0.96,
            height: 0.96,
            label: "Outer spacing band"
          },
          title: crowded ? "Content appears crowded against the edges" : "Outer whitespace appears excessive",
          description: crowded
            ? "The screenshot has very little quiet space around the perimeter, a common signal for clipped or cramped layouts."
            : "Large quiet bands around the perimeter can make the content feel detached or under-composed.",
          recommendation: crowded
            ? "Add consistent padding around page edges and check that sticky controls are not clipped."
            : "Tighten the outer container or rebalance the highlighted whitespace against the main content."
        }
      ];
    }
  },
  {
    id: "spacing.visual-density",
    title: "Visual density",
    category: "spacing",
    evaluate: ({ metrics }) => {
      if (!metrics || metrics.busyRegionRatio <= 0.72 || metrics.edgeDensity <= 0.18) {
        return [];
      }

      return [
        {
          id: "spacing.visual-density.high",
          ruleId: "spacing.visual-density",
          category: "spacing",
          severity: "major",
          status: "warning",
          confidence: 0.68,
          scoreImpact: 13,
          region: {
            x: 0.08,
            y: 0.12,
            width: 0.84,
            height: 0.7,
            label: "Dense content cluster"
          },
          title: "Interface density may be too high",
          description: "Canvas sampling found many busy regions packed together, which can weaken scanability and spacing consistency.",
          recommendation: "Increase section spacing, simplify repeated rows, or break dense content into clearer groups."
        }
      ];
    }
  }
];
