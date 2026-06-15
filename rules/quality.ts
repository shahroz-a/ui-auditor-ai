import type { RuleDefinition } from "@/types/audit";
import { hotspotRegion, metricPercent } from "@/rules/regions";

export const qualityRules: RuleDefinition[] = [
  {
    id: "quality.low-resolution",
    title: "Screenshot quality",
    category: "quality",
    evaluate: ({ image }) => {
      const megapixels = (image.width * image.height) / 1_000_000;

      if (megapixels >= 0.28) {
        return [];
      }

      return [
        {
          id: "quality.low-resolution.small",
          ruleId: "quality.low-resolution",
          category: "quality",
          severity: "major",
          status: "warning",
          confidence: 0.9,
          scoreImpact: 15,
          region: {
            x: 0,
            y: 0,
            width: 1,
            height: 1,
            label: "Full screenshot"
          },
          title: "Screenshot quality is too low",
          description: "The image has too few pixels for dependable contrast, spacing, and typography review.",
          recommendation: "Upload a full-resolution screenshot instead of a thumbnail or compressed preview."
        }
      ];
    }
  },
  {
    id: "quality.visual-softness",
    title: "Blur and softness risk",
    category: "quality",
    evaluate: ({ metrics }) => {
      if (!metrics || metrics.edgeDensity >= 0.025 || metrics.contrastSpread >= 0.12) {
        return [];
      }

      return [
        {
          id: "quality.visual-softness.soft",
          ruleId: "quality.visual-softness",
          category: "quality",
          severity: "minor",
          status: "warning",
          confidence: 0.6,
          scoreImpact: 6,
          region: hotspotRegion(
            metrics,
            {
              x: 0.08,
              y: 0.08,
              width: 0.84,
              height: 0.76,
              label: "Soft visual area"
            },
            "Soft visual cluster"
          ),
          title: "Screenshot may be too soft for detailed review",
          description: "The browser sampler found very little edge definition, which can happen with blurred, scaled, or low-quality screenshots.",
          recommendation: "Use a native-resolution capture so small labels and controls can be reviewed accurately.",
          evidence: [
            `Edge density is ${metricPercent(metrics.edgeDensity)}.`,
            `Contrast spread is ${metricPercent(metrics.contrastSpread)}.`
          ],
          fixPrompt:
            "Recapture at native scale before making fine typography or icon changes based on this screenshot."
        }
      ];
    }
  }
];
