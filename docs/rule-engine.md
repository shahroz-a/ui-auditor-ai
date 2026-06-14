# Rule Engine

Rules are plain TypeScript objects that implement `RuleDefinition`.

```ts
export interface RuleDefinition {
  id: string;
  title: string;
  category: AuditCategory;
  evaluate: (context: RuleContext) => AuditFinding[];
}
```

Each finding includes a normalized screenshot region, confidence, and score impact so the UI can render overlays and exports from the same report contract.

## Rule Principles

- One rule should check one concern.
- Findings should be actionable and point to a visible region whenever possible.
- Rule IDs should be stable because exported reports can reference them.
- Rules should avoid React, browser state, and network access.
- Tests should cover both pass and fail paths.

## Adding A Rule

1. Create or update a file in `rules/`.
2. Export the rule through `rules/index.ts`.
3. Add tests in `tests/unit/` or `tests/integration/`.
4. Update docs if the rule changes user-facing behavior.

## Scoring

Findings are weighted by severity, category, and explicit score impact. Accessibility and responsive findings receive higher weight because they often affect usability and release confidence. Scores are clamped between 0 and 100.
