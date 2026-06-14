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
          title: "Mobile touch targets need a narrow-screen review",
          description: "The screenshot is narrower than the common 375px mobile viewport, which can hide clipped controls or crowded actions.",
          recommendation: "Run the same screen at 320px, 375px, and 390px widths before approving the UI."
        }
      ];
    }
  }
];
