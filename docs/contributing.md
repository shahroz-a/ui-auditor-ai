# Contributing Guide

This guide expands the root [CONTRIBUTING.md](../CONTRIBUTING.md).

## Good First Contributions

- Improve copy in findings or docs.
- Add a pass and fail test for an existing rule.
- Add a small UI primitive state that is already represented in design.
- Improve an empty state with clearer recovery action.

## Rule Contributions

Rules should include:

- Stable `id`.
- Clear `title`.
- One category.
- Deterministic `evaluate` function.
- At least one test.

## Review Culture

Code review should focus on correctness, clarity, accessibility, performance, and testability. Prefer concrete suggestions over broad taste comments.
