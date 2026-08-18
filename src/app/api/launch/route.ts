import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { membershipEnforced } from "@/platform/access";
import { mintLaunchToken } from "@/platform/launch/tokens";
import { resolveWhopSession } from "@/platform/whop";

/**
 * Mints a launch credential for the member currently inside the Whop
 * experience.
 *
 * This is the *only* place a launch token is created, and it will only ever
 * create one for a request that Whop itself has signed and that carries an
 * active entitlement. An unauthenticated or unentitled caller gets nothing —
 * not a token, not a URL, not a hint.
 */
export async function POST() {
  if (!membershipEnforced()) {
    return NextResponse.json(
      { error: "Launch bridge is not configured." },
      { status: 503 },
    );
  }

  const requestHeaders = await headers();
  const session = await resolveWhopSession(requestHeaders);

  // No verified Whop member on this request at all.
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  // Verified, but not a paying member of this experience.
  if (!session.entitled) {
    return NextResponse.json(
      { error: "An active TalkWise Academy membership is required." },
      { status: 403 },
    );
  }

  const token = await mintLaunchToken({ whopUserId: session.externalUserId });
  if (!token) {
    return NextResponse.json(
      { error: "Launch bridge is not configured." },
      { status: 503 },
    );
  }

  // Build the absolute URL the external browser should open. Derived from
  // the request's own host so preview deployments launch into themselves
  // rather than into production.
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? `${protocol}://${host}`;

  return NextResponse.json({
    launchUrl: `${origin}/launch?t=${encodeURIComponent(token)}`,
  });
}
