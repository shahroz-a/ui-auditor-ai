# Roadmap

## Current

- Local upload and metadata-based audits.
- Local CLI and MCP entry points for LLM-assisted UI repair workflows.
- Strict TypeScript engine and reusable UI primitives.
- CI for lint, typecheck, tests, build, dependency review, and code scanning.
- Documentation for architecture, contribution, accessibility, and performance.

## Near Term

- Add canvas-based pixel sampling for contrast and color clusters.
- Support CLI/MCP batch audits across 320, 375, 390, 768, 1024, 1280, and 1440px captures.
- Add report comparison for before and after screenshots.
- Annotate findings on top of the uploaded screenshot.
- Emit agent-ready fix plans that include likely component files, selectors, and viewport reproduction steps.

## Later

- OCR-assisted typography and truncation checks.
- GitHub pull request comments for exported audit reports.
- Optional Vercel preview integration with shareable demo reports.
- Optional model-assisted explanations for complex layout findings.

## Non Goals

- Replacing manual design review.
- Uploading private screenshots to a server by default.
- Requiring a paid service to run the core audit workflow.
- Requiring a hosted backend for CLI, MCP, or local browser audits.
