import type { RuleDefinition } from "@/types/audit";

export const accessibilityRules: RuleDefinition[] = [
  {
    id: "accessibility.viewport-minimum",
    title: "Minimum viewport coverage",
    category: "accessibility",
    evaluate: ({ image }) => {
      if (image.width >= 320 && image.height >= 480) {
        return [];
      }

      return [
        {
          id: "accessibility.viewport-minimum.too-small",
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
          title: "Screenshot is below the smallest supported viewport",
          description: "The capture is smaller than 320 by 480 pixels, so touch targets and text scale cannot be reviewed reliably.",
          recommendation: "Audit a full viewport capture at 320px wide or larger."
        }
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
        {
          id: "accessibility.touch-target-context.narrow",
          ruleId: "accessibility.touch-target-context",
          category: "accessibility",
          severity: "major",
          status: "warning",
          confidence: 0.78,
          scoreImpact: 16,
          region: {
            x: 0.04,
            y: 0.68,
            width: 0.92,
            height: 0.24,
            label: "Primary action area"
          },
          title: "Mobile touch targets need a narrow-screen review",
          description: "The screenshot is narrower than the common 375px mobile viewport, which can hide clipped controls or crowded actions.",
          recommendation: "Run the same screen at 320px, 375px, and 390px widths before approving the UI."
        }
      ];
    }
  },
  {
    id: "accessibility.local-contrast",
    title: "Local contrast separation",
    category: "accessibility",
    evaluate: ({ metrics }) => {
      if (!metrics || metrics.contrastSpread >= 0.16 || metrics.edgeDensity >= 0.06) {
        return [];
      }

      return [
        {
          id: "accessibility.local-contrast.low",
          ruleId: "accessibility.local-contrast",
          category: "accessibility",
          severity: "major",
          status: "warning",
          confidence: 0.7,
          scoreImpact: 14,
          region: {
            x: 0.12,
            y: 0.18,
            width: 0.76,
            height: 0.56,
            label: "Low-contrast content region"
          },
          title: "Visual contrast separation looks weak",
          description: "Local pixel sampling found low luminance separation, which can make labels, controls, and dividers hard to distinguish.",
          recommendation: "Increase foreground/background contrast and avoid low-contrast dividers around the highlighted content."
        }
      ];
    }
  }
];
