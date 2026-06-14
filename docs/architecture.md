# Architecture Notes

This document mirrors [ARCHITECTURE.md](../ARCHITECTURE.md) for docs readers and adds practical implementation notes.

## Project Layout

```text
app/          Next.js routes and global styles
components/   Reusable UI primitives
engine/       Report assembly and scoring
features/     Product workflows
hooks/        Browser state and React hooks
lib/          Shared utility functions
rules/        Audit rules
styles/       Theme variables
types/        Shared TypeScript contracts
```

## Testing Layers

- Unit tests cover pure scoring behavior.
- Integration tests cover report generation.
- Component tests cover accessible UI behavior.
- End-to-end tests cover the home workflow.

## Deployment

The app is Vercel-ready through `vercel.json`. The preview workflow is configured to deploy pull requests when Vercel secrets are present.
