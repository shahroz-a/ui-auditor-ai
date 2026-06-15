# LLM Integration

UI Auditor AI is designed to run inside a developer workflow, not as a hosted service. The repo exposes two local integration paths:

- CLI: run audits from a terminal, CI job, or coding-agent shell.
- MCP: let an LLM client call the local audit tool over stdio.

Both paths keep screenshots on the developer machine.

## Recommended Agent Loop

1. Capture the product screen with Playwright, Cypress, Storybook, or a manual screenshot.
2. Run `ui-auditor` against the image at the viewport being reviewed.
3. Give the JSON or Markdown output to an LLM coding agent.
4. Ask the agent to inspect the affected component, patch the UI, and rerun the screenshot.
5. Re-audit the new screenshot and compare findings.

The CLI/MCP mode is metadata-only today. It checks dimensions, viewport fit, aspect ratio, image format, and LLM-safe fix priorities. Use the browser app for pixel-sampled overlays, density, contrast, and edge-crowding signals.

## CLI

From the repo:

```bash
npm run audit -- audit ./screenshots/dashboard.png --viewport 1440 --format json
npm run audit -- audit ./screenshots/mobile.png --viewport 390 --format markdown --out audit.md
```

When installed as a package:

```bash
npx ui-auditor-ai audit ./screenshots/dashboard.png --viewport 1440 --format json
```

Useful formats:

- `json`: best for automation and CI.
- `markdown`: best for pasting into an LLM chat or issue comment.

Example agent prompt:

```text
Use this UI Auditor AI report as local evidence. Inspect the relevant React/CSS files, fix the highest impact responsive or layout issues, run the app, capture the same viewport again, and rerun the audit. Do not change unrelated UI.
```

## MCP

Start the local MCP server:

```bash
npm run mcp
```

Example client configuration:

```json
{
  "mcpServers": {
    "ui-auditor-ai": {
      "command": "node",
      "args": ["/absolute/path/to/ui-auditor-ai/bin/ui-auditor-mcp.mjs"]
    }
  }
}
```

The server exposes one tool:

- `audit_screenshot`

Input:

```json
{
  "path": "./screenshots/dashboard.png",
  "viewportWidth": 1440,
  "format": "markdown"
}
```

Output is a local audit report with score, findings, regions, recommendations, and an LLM handoff note.

## CI Example

```bash
npm run audit -- audit ./playwright-report/home-1440.png --viewport 1440 --format json --out artifacts/ui-audit-home.json
```

You can fail a workflow by reading the JSON score:

```bash
node -e "const r=require('./artifacts/ui-audit-home.json'); process.exit(r.scores.overall < 85 ? 1 : 0)"
```

## Roadmap For Agents

- Batch audit a folder of screenshots.
- Compare before/after screenshots.
- Emit GitHub PR annotations.
- Connect browser pixel metrics to the Node CLI.
- Add optional OCR for truncation and typography findings.
