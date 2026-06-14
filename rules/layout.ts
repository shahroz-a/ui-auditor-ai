import type { RuleDefinition } from "@/types/audit";

export const layoutRules: RuleDefinition[] = [
  {
    id: "layout.visual-balance",
    title: "Layout balance",
    category: "layout",
    evaluate: ({ metrics }) => {
      if (!metrics) {
        return [];
      }

      const horizontalIssue = metrics.horizontalBalance > 0.24;
      const verticalIssue = metrics.verticalBalance > 0.28;

      if (!horizontalIssue && !verticalIssue) {
        return [];
      }

      const rightHeavy = metrics.rightActivity > metrics.leftActivity;
      const bottomHeavy = metrics.bottomActivity > metrics.topActivity;

      return [
        {
          id: "layout.visual-balance.uneven",
          ruleId: "layout.visual-balance",
          category: "layout",
          severity: "major",
          status: "warning",
          confidence: 0.66,
          scoreImpact: 14,
          region: {
            x: horizontalIssue && rightHeavy ? 0.5 : 0,
            y: verticalIssue && bottomHeavy ? 0.5 : 0,
            width: horizontalIssue ? 0.5 : 1,
            height: verticalIssue ? 0.5 : 1,
            label: "Heavier layout side"
          },
          title: "Layout weight looks uneven",
          description: "The sampled screenshot has a noticeably heavier activity cluster on one side of the viewport.",
          recommendation: "Rebalance the highlighted area with clearer grouping, spacing, or a stronger primary content anchor."
        }
      ];
    }
  },
  {
    id: "layout.edge-clipping",
    title: "Overflow and clipping risk",
    category: "layout",
    evaluate: ({ metrics }) => {
      if (!metrics || metrics.edgeCrowding <= 0.24) {
        return [];
      }

      return [
        {
          id: "layout.edge-clipping.crowded",
          ruleId: "layout.edge-clipping",
          category: "layout",
          severity: "major",
          status: "warning",
          confidence: 0.7,
          scoreImpact: 15,
          region: {
            x: 0.86,
            y: 0.04,
            width: 0.12,
            height: 0.92,
            label: "Viewport edge"
          },
          title: "Content may be clipped near the viewport edge",
          description: "High activity on the screenshot boundary can indicate overflowing text, sticky controls, or cropped components.",
          recommendation: "Inspect the highlighted edge at the same viewport width and add padding, wrapping, or responsive constraints."
        }
      ];
    }
  }
];
