# Getting Started

## Requirements

- Node.js 22.0 or newer.
- npm 10.2 or newer.

## Install

```bash
npm ci
npm run dev
```

Open http://localhost:3000.

## First Audit

Upload or paste a PNG, JPG, JPEG, WebP, or AVIF screenshot. The app validates the file locally, reads image dimensions, samples pixels in the browser when available, runs the ruleset, and renders a report with score breakdowns, annotations, and findings.

## CLI Audit

Use the CLI when you want an artifact for CI or an LLM coding agent:

```bash
npm run audit -- audit ./screenshots/dashboard.png --viewport 1440 --format json
npm run audit -- audit ./screenshots/mobile.png --viewport 390 --format markdown --out audit.md
```

The CLI is local and metadata-only today. Use it to catch viewport, aspect-ratio, resolution, and format issues before handing work to an agent.

## MCP Server

Use the MCP server when an LLM client should call UI Auditor AI directly:

```bash
npm run mcp
```

See [LLM Integration](llm-integration.md) for configuration and agent prompts.

## Useful Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run audit -- audit ./screenshots/example.png --viewport 1440
npm run mcp
```

## Troubleshooting

- If `npm ci` fails, remove stale package manager files and reinstall with npm.
- If Playwright browsers are missing, run `npx playwright install`.
- If URL capture is unavailable, take a manual screenshot and upload or paste it.
- If an image fails to decode, export the screenshot again as PNG or WebP.
- If a Cloudflare Pages or Workers deploy fails during `npx wrangler deploy`, confirm the build is using Node.js 22 or newer. The repository pins Cloudflare and CI builds through `.node-version`; if the Cloudflare dashboard also defines `NODE_VERSION`, set it to `22.16.0` or remove it so the checked-in version file is honored.
