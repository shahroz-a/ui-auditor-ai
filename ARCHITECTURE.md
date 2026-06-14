# Architecture

UI Auditor AI is a local-first Next.js application with a deterministic rules engine. The first version audits screenshot metadata and review context; later versions can add pixel sampling, OCR, and model-assisted findings behind the same report contract.

## Runtime Flow

1. `features/audit/auditor-shell.tsx` renders the workflow.
2. `hooks/use-image-upload.ts` validates the selected file, creates a local object URL, and reads browser image dimensions.
3. `lib/visual-metrics.ts` samples a downscaled screenshot through Canvas when the browser allows it.
4. `engine/audit-engine.ts` runs all rules and builds a typed report with regions, confidence, and score impact.
5. `features/audit/annotated-preview.tsx` renders issue boxes, pins, and guide overlays from report regions.
6. `reports/exporters.ts` generates JSON, Markdown, CSV, annotated PNG, and printable PDF reports locally.
7. UI components render empty, loading, error, success, and warning states.

## Boundaries

- `components/ui/` has primitives only. They do not know about screenshots or reports.
- `capture/` contains screenshot provider adapters. The web app exposes URL limitations instead of pretending cross-origin capture is available.
- `features/audit/` composes primitives into product workflows.
- `rules/` contains small rule modules with no React dependency.
- `engine/` owns scoring and report assembly.
- `reports/` owns browser-only export formatting.
- `lib/` contains generic helpers and browser-safe utility functions.
- `types/` defines shared contracts used by app, rules, tests, and examples.

## Data Model

The main artifact is `AuditReport`:

- `image` stores screenshot metadata.
- `checks` records pass, warning, or fail per rule.
- `findings` stores actionable review items with severity, confidence, score impact, and normalized target regions.
- `viewport` stores the active responsive review context.
- `metrics` stores optional local Canvas sampling signals.
- `summary` counts findings by severity.
- `scores` gives category and overall scores.

## Error Strategy

Upload errors are typed in `types/image.ts` and mapped to recovery UI. The app handles empty files, unsupported formats, oversized images, decode failures, and browser image API limitations without uncaught runtime errors.

## Extending Rules

Add a `RuleDefinition` in `rules/`, export it from `rules/index.ts`, and add coverage in `tests/integration/audit-engine.test.ts` or a focused unit test. Rules should be deterministic, low side-effect, and written in terms of `RuleContext`.
