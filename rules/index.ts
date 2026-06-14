import { accessibilityRules } from "@/rules/accessibility";
import { componentRules } from "@/rules/components";
import { layoutRules } from "@/rules/layout";
import { performanceRules } from "@/rules/performance";
import { qualityRules } from "@/rules/quality";
import { responsiveRules } from "@/rules/responsive";
import { spacingRules } from "@/rules/spacing";
import { typographyRules } from "@/rules/typography";

export const rules = [
  ...accessibilityRules,
  ...componentRules,
  ...layoutRules,
  ...qualityRules,
  ...responsiveRules,
  ...spacingRules,
  ...typographyRules,
  ...performanceRules
];
