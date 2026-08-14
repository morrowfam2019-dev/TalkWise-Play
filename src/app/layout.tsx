import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalkWise Play",
  description:
    "Speech-learning adventure games for kids from TalkWise Academy. Explore, play, and practice your sounds.",
};

export const viewport: Viewport = {
  themeColor: "#141420",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

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
