# Accessibility

## Baseline

UI Auditor AI targets WCAG AA. The app should be usable with keyboard navigation, screen readers, reduced motion, and high zoom.

## Implementation Notes

- Controls use native buttons and inputs.
- Focus rings are visible.
- Empty, loading, and error states are explicit.
- Dialogs expose `role="dialog"` and close on Escape.
- Progress indicators expose `role="progressbar"`.
- The layout starts at 320px wide without horizontal scrolling.

## Review Checklist

- Tab through upload, reset, export, and external links.
- Test at 320px, 375px, 390px, 768px, and 1440px widths.
- Check reduced-motion mode.
- Run a screen reader smoke test on the upload and report regions.
- Verify color contrast after palette changes.
