import { MAX_IMAGE_BYTES } from "@/lib/file-guards";
import type { RuleDefinition } from "@/types/audit";

export const performanceRules: RuleDefinition[] = [
  {
    id: "performance.capture-weight",
    title: "Screenshot weight",
    category: "performance",
    evaluate: ({ image }) => {
      if (image.size <= MAX_IMAGE_BYTES * 0.65) {
        return [];
      }

      return [
        {
          id: "performance.capture-weight.large",
          ruleId: "performance.capture-weight",
          category: "performance",
          severity: "minor",
          status: "warning",
          confidence: 0.92,
          scoreImpact: 7,
          region: {
            x: 0,
            y: 0,
            width: 1,
            height: 1,
            label: "Screenshot file"
          },
          title: "Screenshot is heavy",
          description: "Large captures slow local analysis and make pull request review harder.",
          recommendation: "Compress the image or crop unrelated browser chrome before sharing the audit."
        }
      ];
    }
  }
];
