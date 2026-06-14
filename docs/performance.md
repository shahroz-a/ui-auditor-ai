# Performance

## Targets

- 95+ Lighthouse Performance.
- 100 Lighthouse Accessibility.
- 100 Lighthouse Best Practices.
- 100 Lighthouse SEO.
- Under 200ms for metadata-only audits on common screenshots.

## Current Strategy

- Keep the engine pure and small.
- Avoid server round trips for core analysis.
- Lazy-load future heavy modules such as OCR, canvas clustering, or model clients.
- Revoke object URLs to avoid leaking browser memory.
- Keep UI state local and avoid unnecessary renders.

## Future Benchmarks

When pixel sampling lands, benchmarks should include:

- 1440 by 1024 PNG under 2 MB.
- 390 by 844 mobile capture.
- 3840 wide desktop capture.
- Corrupted and oversized image recovery paths.
