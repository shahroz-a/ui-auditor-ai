import type { RuleDefinition } from "@/types/audit";
import { hotspotRegion, metricPercent } from "@/rules/regions";

export const typographyRules: RuleDefinition[] = [
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
        {
          id: "typography.pixel-density.low",
          ruleId: "typography.pixel-density",
          category: "typography",
          severity: "major",
          status: "warning",
          confidence: 0.9,
          scoreImpact: 16,
          region: {
            x: 0.08,
            y: 0.12,
            width: 0.84,
            height: 0.72,
            label: "Text review area"
          },
          title: "Resolution is too low for typography review",
          description: "Small screenshots make text weight, truncation, and line-height issues hard to detect.",
          recommendation: "Upload a higher resolution capture of the same viewport."
        }
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
        {
          id: "typography.lossy-format.jpeg",
          ruleId: "typography.lossy-format",
          category: "typography",
          severity: "minor",
          status: "warning",
          confidence: 0.74,
          scoreImpact: 7,
          region: {
            x: 0.1,
            y: 0.1,
            width: 0.8,
            height: 0.7,
            label: "Text rendering area"
          },
          title: "JPEG compression can soften interface text",
          description: "Lossy compression may blur small labels, icons, and dense table text.",
          recommendation: "Prefer PNG or WebP for final typography and contrast review."
        }
      ];
    }
  },
  {
    id: "typography.hierarchy",
    title: "Typographic hierarchy",
    category: "typography",
    evaluate: ({ metrics }) => {
      if (!metrics || metrics.contrastSpread >= 0.2 || metrics.colorComplexity >= 0.36) {
        return [];
      }

      return [
        {
          id: "typography.hierarchy.weak",
          ruleId: "typography.hierarchy",
          category: "typography",
          severity: "major",
          status: "warning",
          confidence: 0.64,
          scoreImpact: 13,
          region: hotspotRegion(
            metrics,
            {
              x: 0.12,
              y: 0.1,
              width: 0.76,
              height: 0.62,
              label: "Hierarchy stack"
            },
            "Flat hierarchy cluster"
          ),
          title: "Hierarchy appears visually flat",
          description: "The sampled screenshot has limited tonal and color separation, which often means headings, labels, and actions are not differentiated enough.",
          recommendation: "Strengthen heading scale, weight, section rhythm, or key action contrast in the highlighted area.",
          evidence: [
            `Contrast spread is ${metricPercent(metrics.contrastSpread)}.`,
            `Color complexity is ${metricPercent(metrics.colorComplexity)}.`
          ],
          fixPrompt:
            "Strengthen heading scale, weight, and key action contrast in the highlighted cluster before changing unrelated typography."
        }
      ];
    }
  }
];
