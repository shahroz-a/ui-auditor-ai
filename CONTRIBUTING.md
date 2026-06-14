# Contributing

Thanks for helping improve UI Auditor AI. The project values small, clear changes with tests and readable intent.

## Setup

```bash
npm ci
npm run dev
```

## Before Opening A Pull Request

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Run `npm run test:e2e` for workflow changes.

## Commit Style

Use small, meaningful commits:

- `feat: add image upload pipeline`
- `fix: improve spacing detection accuracy`
- `docs: expand contribution guide`
- `test: add audit engine coverage`

Local commits authored for this repository should use:

```bash
git config user.name "Shahroz"
git config user.email "shahrozmails@gmail.com"
```

## Pull Request Expectations

- Keep the scope focused.
- Add tests for changed behavior.
- Update docs when public behavior changes.
- Avoid commented-out code, generic boilerplate, and unused abstractions.
- Prefer deterministic rules over opaque heuristics unless the tradeoff is documented.

## Development Notes

The audit engine is framework-independent. When possible, add behavior in `engine/` or `rules/` first, then wire it into the UI.
