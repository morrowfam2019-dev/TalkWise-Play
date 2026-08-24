import "server-only";
import { cookies, headers } from "next/headers";
import { getLaunchSecret } from "./launch/crypto";
import {
  decodeSession,
  encodeSession,
  needsRevalidation,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "./launch/session-cookie";
import { checkWhopEntitlement, resolveWhopSession } from "./whop";

/**
 * The single place that answers "what is this request allowed to do?".
 *
 * There are exactly three ways to be inside TalkWise Play:
 *
 * 1. **Embedded in Whop** with a verified member token. Whop itself is the
 *    proof. This is the context that can mint a launch credential.
 * 2. **In a normal browser** holding a TalkWise Play session cookie that was
 *    issued by `/launch` in exchange for a valid launch credential.
 * 3. **Unprotected**, when membership enforcement is switched off — which is
 *    the case until `TALKWISE_LAUNCH_SECRET` is configured, because a gate
 *    that cannot verify its own tokens would lock everybody out rather than
 *    let members in.
 *
 * Anything else gets the locked screen and no game content.
 */

export type AccessMode =
  /** Membership enforcement is off — open access, current pre-launch behaviour. */
  | "unenforced"
  /** Inside Whop, verified and entitled. Can launch to an external browser. */
  | "whop-embedded"
  /** External browser holding a valid TalkWise Play session. */
  | "browser-session"
  /** Inside Whop, verified, but without an active entitlement. */
  | "not-entitled"
  /** No proof of anything. */
  | "locked";

export interface AccessDecision {
  mode: AccessMode;
  /** True when protected game content may render. */
  allowed: boolean;
  /** Whop member id, when known. */
  whopUserId: string | null;
  /** True only inside the Whop iframe, where the launch button belongs. */
  embedded: boolean;
}

/**
 * Whether paid-membership enforcement is active.
 *
 * Tied to the launch secret on purpose: enforcement and the launch bridge
 * are the same feature, and enabling one without the other would either
 * lock out every member (gate on, bridge broken) or advertise a launch flow
 * that protects nothing (bridge on, gate off). One env var turns on both.
 */
export function membershipEnforced(): boolean {
  return getLaunchSecret() !== null;
}

/**
 * Whether this request is being rendered inside a frame (Whop's embed, or
 * anything else) rather than as a top-level page.
 *
 * `sec-fetch-dest: iframe` is sent by every current WebKit/Chromium/Firefox
 * browser on a framed navigation and can't be set by page JavaScript, so it
 * is trustworthy signal — unlike the session cookie itself: `SameSite=Lax`
 * only blocks a cookie on *cross-site* requests, and Whop's embed loads our
 * own domain, so it's same-site and the cookie is sent regardless of
 * framing. Without this check, a browser that ever completed one real
 * `/launch` would carry a cookie that keeps working inside Whop's iframe
 * forever after — exactly the "game plays embedded, mic broken" bug this
 * function exists to prevent.
 */
function isFramed(requestHeaders: Headers): boolean {
  return requestHeaders.get("sec-fetch-dest") === "iframe";
}

export async function resolveAccess(): Promise<AccessDecision> {
  const requestHeaders = await headers();

  // 1. Whop embedded context — ask Whop directly. This runs first because
  //    it is the strongest proof available and it is also how a member gets
  //    their first session.
  const whopSession = await resolveWhopSession(requestHeaders);
  if (whopSession) {
    if (whopSession.entitled) {
      return {
        mode: "whop-embedded",
        allowed: true,
        whopUserId: whopSession.externalUserId,
        embedded: true,
      };
    }
    return {
      mode: "not-entitled",
      allowed: false,
      whopUserId: whopSession.externalUserId,
      embedded: true,
    };
  }

  // A framed request with no verifiable Whop session is never trusted with
  // the browser-session cookie below, no matter what the cookie says — see
  // `isFramed`. Play only ever happens top-level.
  if (isFramed(requestHeaders)) {
    return { mode: "locked", allowed: false, whopUserId: null, embedded: true };
  }

  // 2. External browser holding a session cookie we issued.
  if (membershipEnforced()) {
    const cookieStore = await cookies();
    const session = await decodeSession(
      cookieStore.get(SESSION_COOKIE_NAME)?.value,
    );

    if (session) {
      if (!needsRevalidation(session)) {
        return {
          mode: "browser-session",
          allowed: true,
          whopUserId: session.whopUserId,
          embedded: false,
        };
      }

      // Stale check — re-ask Whop whether this member is still a member.
      const stillEntitled = await checkWhopEntitlement(session.whopUserId);

      if (stillEntitled === false) {
        // Membership genuinely ended. Drop the cookie and lock up.
        cookieStore.delete(SESSION_COOKIE_NAME);
        return {
          mode: "locked",
          allowed: false,
          whopUserId: session.whopUserId,
          embedded: false,
        };
      }

      // `true` (still a member) or `null` (Whop unreachable / not
      // configured). Either way the family keeps playing; on a confirmed
      // `true` we stamp a fresh verification time so we are not re-asking
      // Whop on every single navigation.
      if (stillEntitled === true) {
        const refreshed = await encodeSession({
          ...session,
          verifiedAt: Date.now(),
        });
        if (refreshed) {
          cookieStore.set(SESSION_COOKIE_NAME, refreshed, SESSION_COOKIE_OPTIONS);
        }
      }

      return {
        mode: "browser-session",
        allowed: true,
        whopUserId: session.whopUserId,
        embedded: false,
      };
    }

    return { mode: "locked", allowed: false, whopUserId: null, embedded: false };
  }

  // 3. Enforcement not configured — behave exactly as the app did before
  //    the launch bridge existed.
  return { mode: "unenforced", allowed: true, whopUserId: null, embedded: false };
}
