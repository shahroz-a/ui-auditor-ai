# How It Works

UI Auditor AI currently performs metadata-based screenshot audits. That keeps the first version fast, private, and deterministic.

## Audit Steps

1. Validate file size and MIME type.
2. Decode the screenshot in the browser.
3. Extract width, height, size, type, and last-modified metadata.
4. Run each rule against the shared `RuleContext`.
5. Summarize findings and calculate scores.
6. Render findings and allow JSON export.

## Why Metadata First

Metadata catches a surprising amount of review risk: missing mobile breakpoints, tiny captures, extreme aspect ratios, low-resolution typography review, and heavy screenshot artifacts. Pixel and OCR checks can be added later without changing the report shape.

## Privacy

The screenshot stays in the browser. Object URLs are revoked when the user resets the upload, hits an error, or leaves the screen.
