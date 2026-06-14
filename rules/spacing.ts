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
          title: "Screenshot width is outside common review breakpoints",
          description: "The capture does not closely match the documented viewport sizes, so spacing decisions may not represent a real device class.",
          recommendation: "Re-run the audit at 320, 375, 390, 768, 1024, 1280, or 1440px widths."
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
          title: "Capture has an extreme aspect ratio",
          description: "Very tall or very wide captures often hide sticky navigation, modals, and overflow behavior.",
          recommendation: "Pair this capture with a normal viewport screenshot before accepting the audit."
        }
      ];
    }
  }
];
