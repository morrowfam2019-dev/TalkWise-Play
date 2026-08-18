import { NextResponse, type NextRequest } from "next/server";
import {
  encodeSession,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/platform/launch/session-cookie";
import { redeemLaunchToken } from "@/platform/launch/tokens";

/**
 * The external-browser side of the launch bridge.
 *
 * The member's normal browser lands here once, holding a launch credential
 * minted inside Whop. That credential is redeemed (and immediately burned),
 * and in exchange the browser is given a real TalkWise Play session cookie.
 * Then we redirect to the game library — with the token stripped from the
 * URL, so it never sits in history, never gets screenshotted, and never
 * ends up in a referrer header.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");
  const library = new URL("/", request.nextUrl.origin);
  const locked = new URL("/locked", request.nextUrl.origin);

  if (!token) {
    return NextResponse.redirect(locked);
  }

  const claim = await redeemLaunchToken(token);
  if (!claim) {
    // Expired, already used, tampered with, or minted with a different
    // secret. All of them mean the same thing to the visitor.
    locked.searchParams.set("reason", "expired");
    return NextResponse.redirect(locked);
  }

  const now = Date.now();
  const session = await encodeSession({
    whopUserId: claim.whopUserId,
    issuedAt: now,
    verifiedAt: now,
  });

  if (!session) {
    return NextResponse.redirect(locked);
  }

  const response = NextResponse.redirect(library);
  response.cookies.set(SESSION_COOKIE_NAME, session, SESSION_COOKIE_OPTIONS);
  return response;
}
