import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalkWise Play",
  description:
    "Speech-learning games for kids from TalkWise Academy. Explore, play, and practice your sounds.",
};

export const viewport: Viewport = {
  themeColor: "#141420",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/**
 * Document shell only.
 *
 * Membership resolution deliberately lives in the `(protected)` layout
 * rather than here, so the locked screen and the launch exchange can render
 * without paying for — or being blocked by — an entitlement check.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
