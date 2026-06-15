import type { RuleDefinition } from "@/types/audit";
import { hotspotRegion, metricPercent } from "@/rules/regions";

const mobileWidths = [320, 375, 390, 414];

export const responsiveRules: RuleDefinition[] = [
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
        {
          id: "responsive.capture-match.mismatch",
          ruleId: "responsive.capture-match",
          category: "responsive",
          severity: selectedMobile ? "major" : "minor",
          status: "warning",
          confidence: selectedMobile ? 0.82 : 0.7,
          scoreImpact: selectedMobile ? 15 : 7,
          region: {
            x: 0.03,
            y: 0.03,
            width: 0.94,
            height: 0.94,
            label: `${viewport.label} comparison`
          },
          title: "Selected viewport does not match this capture",
          description: `The uploaded screenshot is ${image.width}px wide, but the active review viewport is ${viewport.width}px.`,
          recommendation: "Upload a capture taken at the selected viewport width for a reliable responsive comparison."
        }
      ];
    }
  },
  {
    id: "responsive.mobile-regression-risk",
    title: "Small-screen regression risk",
    category: "responsive",
    evaluate: ({ metrics, viewport }) => {
      if (!metrics || viewport.width > 414 || metrics.busyRegionRatio < 0.64 || metrics.edgeCrowding < 0.16) {
        return [];
      }

      return [
        {
          id: "responsive.mobile-regression-risk.dense",
          ruleId: "responsive.mobile-regression-risk",
          category: "responsive",
          severity: "major",
          status: "warning",
          confidence: 0.68,
          scoreImpact: 14,
          title: "Dense layout may regress on small screens",
          description: "The selected mobile viewport has dense sampled regions and crowded edges, which often exposes wrapping or clipping at small widths.",
          region: hotspotRegion(
            metrics,
            {
              x: 0.06,
              y: 0.14,
              width: 0.88,
              height: 0.74,
              label: "Mobile layout stack"
            },
            "Densest mobile stack"
          ),
          recommendation: "Review the highlighted stack at 320px, 375px, 390px, and 414px before shipping.",
          evidence: [
            `${metricPercent(metrics.busyRegionRatio)} of sampled regions are busy.`,
            `Boundary activity is ${metricPercent(metrics.edgeCrowding)} at ${viewport.label}.`
          ],
          fixPrompt:
            "Open the same screen at common mobile widths and reduce wrapping pressure around the highlighted stack."
        }
      ];
    }
  }
];
