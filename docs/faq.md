# FAQ

## Does UI Auditor AI use remote AI APIs?

No. The audit engine is deterministic and local-first. It uses browser APIs and local rules rather than paid AI APIs, remote image analysis, or a backend.

## What image formats are supported?

PNG, JPG, JPEG, WebP, and AVIF.

## What viewport widths should I test?

Use 320, 375, 390, 414, 768, 1024, 1280, 1440, and custom widths when relevant.

## Why can't the app capture every URL directly?

Browser security prevents a normal web app from screenshotting arbitrary external sites. Use upload or paste today; a browser extension can plug into the capture adapter later.

## Can I use this in a private product workflow?

Yes. The project is MIT licensed. Review the security model before adding server-side processing.

## Why did my screenshot get a warning if the UI looks fine?

The app flags review risk. A warning means the capture may be insufficient for confident review, not that the product UI is automatically wrong.
