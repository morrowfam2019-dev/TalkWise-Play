import { NextResponse, type NextRequest } from "next/server";
import {
  ACADEMY_SESSION_COOKIE_NAME,
  ACADEMY_SESSION_COOKIE_OPTIONS,
  encodeAcademySession,
  redeemAcademyLaunchToken,
} from "@/platform/academy";
import {
  encodeSession,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/platform/launch/session-cookie";
import { redeemLaunchToken } from "@/platform/launch/tokens";
import { getGame, type GameId } from "@/platform/games/registry";

/**
 * One-time external-browser launch bridge for both legacy Whop access and
 * TalkWise Academy. Academy tokens are learner + game scoped and are
 * exchanged for a short-lived HttpOnly session before the token is removed
 * from the URL.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");
  const source = request.nextUrl.searchParams.get("source");
  const locked = new URL("/locked", request.nextUrl.origin);

  if (!token) return NextResponse.redirect(locked);

  if (source === "academy") {
    const claim = await redeemAcademyLaunchToken(token);
    if (!claim) {
      locked.searchParams.set("reason", "expired");
      return NextResponse.redirect(locked);
    }

    let game;
    try {
      game = getGame(claim.game_id as GameId);
    } catch {
      locked.searchParams.set("reason", "game");
      return NextResponse.redirect(locked);
    }

    if (game.status !== "live") {
      locked.searchParams.set("reason", "game");
      return NextResponse.redirect(locked);
    }

    const session = await encodeAcademySession(claim);
    if (!session) return NextResponse.redirect(locked);

    const response = NextResponse.redirect(new URL(game.route, request.nextUrl.origin));
    response.cookies.set(
      ACADEMY_SESSION_COOKIE_NAME,
      session,
      ACADEMY_SESSION_COOKIE_OPTIONS,
    );
    // Never allow a stale legacy session to widen an Academy-scoped launch.
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  const claim = await redeemLaunchToken(token);
  if (!claim) {
    locked.searchParams.set("reason", "expired");
    return NextResponse.redirect(locked);
  }

  const now = Date.now();
  const session = await encodeSession({
    whopUserId: claim.whopUserId,
    issuedAt: now,
    verifiedAt: now,
  });
  if (!session) return NextResponse.redirect(locked);

  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin));
  response.cookies.set(SESSION_COOKIE_NAME, session, SESSION_COOKIE_OPTIONS);
  response.cookies.delete(ACADEMY_SESSION_COOKIE_NAME);
  return response;
}
