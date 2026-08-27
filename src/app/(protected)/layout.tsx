import { redirect } from "next/navigation";
import { resolveAccess } from "@/platform/access";
import { LaunchScreen } from "@/platform/LaunchScreen";
import { PlatformSessionProvider } from "@/platform/PlatformSessionProvider";
import { toPlatformSession } from "@/platform/session";
import { ProgressSync } from "@/player/ProgressSync";

/**
 * The membership gate.
 *
 * Everything under this route group is protected gameplay. `/launch`,
 * `/api/launch` and `/locked` sit outside it on purpose — a locked-out
 * visitor has to be able to read why, and a launching member has to be able
 * to redeem their credential, without either being gated by the thing they
 * are trying to get through.
 *
 * Note this runs on the server for every protected navigation, so the
 * decision is never something a client can talk its way past: an
 * unauthorised visitor is redirected before any game code is sent.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await resolveAccess();

  // Inside the Whop app, a paying member is handed off to their own browser
  // rather than played in-frame, because the microphone does not work in the
  // embedded webview. This is the whole reason the launch bridge exists.
  if (access.mode === "whop-embedded") {
    return <LaunchScreen />;
  }

  if (!access.allowed) {
    redirect(
      access.mode === "not-entitled" ? "/locked?reason=membership" : "/locked",
    );
  }

  return (
    <PlatformSessionProvider session={toPlatformSession(access)}>
      {/* Server-backed progress, for members whose identity we know. Inert
          when there is no verified member or no configured store. */}
      <ProgressSync />
      {children}
    </PlatformSessionProvider>
  );
}
