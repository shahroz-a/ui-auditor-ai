import type { RuleDefinition } from "@/types/audit";

export const componentRules: RuleDefinition[] = [
  {
    id: "components.consistency-risk",
    title: "Component consistency risk",
    category: "components",
    evaluate: ({ metrics }) => {
      if (!metrics || metrics.colorComplexity <= 0.68 || metrics.edgeDensity <= 0.16) {
        return [];
      }

      return [
        {
          id: "components.consistency-risk.mixed",
          ruleId: "components.consistency-risk",
          category: "components",
          severity: "minor",
          status: "warning",
          confidence: 0.58,
          scoreImpact: 6,
          region: {
            x: 0.1,
            y: 0.1,
            width: 0.8,
            height: 0.72,
            label: "Repeated component region"
          },
          title: "Repeated components may feel inconsistent",
          description: "Pixel sampling found a high mix of color and edge patterns in the main content area, which can point to mixed component treatments.",
          recommendation: "Check repeated cards, inputs, badges, and buttons in the highlighted area for consistent radius, padding, borders, and states."
        }
      ];
    }
  }
];
