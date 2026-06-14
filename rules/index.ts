import { accessibilityRules } from "@/rules/accessibility";
import { performanceRules } from "@/rules/performance";
import { spacingRules } from "@/rules/spacing";
import { typographyRules } from "@/rules/typography";

export const rules = [
  ...accessibilityRules,
  ...spacingRules,
  ...typographyRules,
  ...performanceRules
];
