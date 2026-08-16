import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { PlatformSessionProvider } from "@/platform/PlatformSessionProvider";
import { toPlatformSession } from "@/platform/session";
import { resolveWhopSession } from "@/platform/whop";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const verified = await resolveWhopSession(await headers());
  const session = toPlatformSession(verified);

  return (
    <html lang="en">
      <body>
        <PlatformSessionProvider session={session}>
          {children}
        </PlatformSessionProvider>
      </body>
    </html>
  );
}
