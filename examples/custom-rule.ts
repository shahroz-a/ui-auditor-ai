import type { RuleDefinition } from "@/types/audit";

export const minimumDesktopReviewRule: RuleDefinition = {
  id: "example.minimum-desktop-review",
  title: "Desktop review capture",
  category: "layout",
  evaluate: ({ image }) => {
    if (image.width >= 1024) {
      return [];
    }

    return [
      {
        id: "example.minimum-desktop-review.missing",
        ruleId: "example.minimum-desktop-review",
        category: "layout",
        severity: "minor",
        status: "warning",
        title: "Desktop capture missing",
        description: "This audit only includes a narrow capture.",
        recommendation: "Add a desktop screenshot before merging the UI change."
      }
    ];
  }
};
