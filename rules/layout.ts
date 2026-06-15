import type { RuleDefinition } from "@/types/audit";
import { edgeActivityRegion, hotspotRegion, metricPercent, strongestEdge } from "@/rules/regions";

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
      const sideLabel = horizontalIssue
        ? rightHeavy
          ? "right side"
          : "left side"
        : bottomHeavy
          ? "lower half"
          : "upper half";
      const fallbackRegion = {
        x: horizontalIssue && rightHeavy ? 0.5 : 0,
        y: verticalIssue && bottomHeavy ? 0.5 : 0,
        width: horizontalIssue ? 0.5 : 1,
        height: verticalIssue ? 0.5 : 1,
        label: `Heavier layout area: ${sideLabel}`
      };

      return [
        {
          id: "layout.visual-balance.uneven",
          ruleId: "layout.visual-balance",
          category: "layout",
          severity: "major",
          status: "warning",
          confidence: 0.66,
          scoreImpact: 14,
          region: hotspotRegion(metrics, fallbackRegion, "Heavier layout cluster"),
          title: "Layout weight looks uneven",
          description: "The sampled screenshot has a noticeably heavier activity cluster on one side of the viewport.",
          recommendation: "Rebalance the highlighted area with clearer grouping, spacing, or a stronger primary content anchor.",
          evidence: [
            `${sideLabel} is carrying more visual activity than the opposite side.`,
            `Horizontal balance ${metricPercent(metrics.horizontalBalance)} · vertical balance ${metricPercent(metrics.verticalBalance)}.`
          ],
          fixPrompt:
            "Inspect the highlighted cluster and adjust grid proportions, whitespace, or the primary content anchor so the page scans evenly."
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
      const activeEdge = strongestEdge(metrics);

      return [
        {
          id: "layout.edge-clipping.crowded",
          ruleId: "layout.edge-clipping",
          category: "layout",
          severity: "major",
          status: "warning",
          confidence: 0.7,
          scoreImpact: 15,
          region: edgeActivityRegion(metrics, "Crowded viewport edge"),
          title: "Content may be clipped near the viewport edge",
          description: "High activity on the screenshot boundary can indicate overflowing text, sticky controls, or cropped components.",
          recommendation: "Inspect the highlighted edge at the same viewport width and add padding, wrapping, or responsive constraints.",
          evidence: [
            `${activeEdge.edge} edge has the strongest boundary activity at ${metricPercent(activeEdge.activity)}.`,
            `Overall edge crowding is ${metricPercent(metrics.edgeCrowding)}.`
          ],
          fixPrompt:
            "Check components touching the highlighted edge for overflow, fixed positioning, missing padding, or unwrapped text."
        }
      ];
    }
  }
];
