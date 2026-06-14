import type { RuleDefinition } from "@/types/audit";

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
          title: "JPEG compression can soften interface text",
          description: "Lossy compression may blur small labels, icons, and dense table text.",
          recommendation: "Prefer PNG or WebP for final typography and contrast review."
        }
      ];
    }
  }
];
