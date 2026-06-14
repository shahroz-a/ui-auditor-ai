import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "UI Auditor AI",
  description: "Local-first screenshot audits for accessibility, spacing, typography, and layout quality.",
  metadataBase: new URL("https://github.com/shahroz-a/ui-auditor-ai"),
  openGraph: {
    title: "UI Auditor AI",
    description: "Audit UI screenshots before they ship.",
    images: ["/hero-screenshot.svg"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#19a974"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
