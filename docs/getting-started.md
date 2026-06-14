# Getting Started

## Requirements

- Node.js 20.19 or newer.
- npm 10.2 or newer.

## Install

```bash
npm ci
npm run dev
```

Open http://localhost:3000.

## First Audit

Upload a PNG, JPG, or WebP screenshot. The app validates the file locally, reads image dimensions, runs the ruleset, and renders a report with score breakdowns and findings.

## Useful Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Troubleshooting

- If `npm ci` fails, remove stale package manager files and reinstall with npm.
- If Playwright browsers are missing, run `npx playwright install`.
- If an image fails to decode, export the screenshot again as PNG or WebP.
