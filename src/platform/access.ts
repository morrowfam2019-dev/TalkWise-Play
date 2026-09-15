import "server-only";
import { cookies, headers } from "next/headers";
import { decodeAcademySession, ACADEMY_SESSION_COOKIE_NAME } from "./academy";
import { getLaunchSecret } from "./launch/crypto";
import {
  decodeSession,
  encodeSession,
  needsRevalidation,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "./launch/session-cookie";
import { checkWhopEntitlement, resolveWhopSession } from "./whop";

export type AccessMode =
  | "unenforced"
  | "whop-embedded"
  | "browser-session"
  | "academy-session"
  | "not-entitled"
  | "locked";

export interface AccessDecision {
  mode: AccessMode;
  allowed: boolean;
  whopUserId: string | null;
  embedded: boolean;
  adultUserId: string | null;
  householdId: string | null;
  learnerId: string | null;
  /** null means legacy/full-library access; an array means exact game scope. */
  allowedGameIds: string[] | null;
}

const locked = (embedded = false): AccessDecision => ({
  mode: "locked",
  allowed: false,
  whopUserId: null,
  embedded,
  adultUserId: null,
  householdId: null,
  learnerId: null,
  allowedGameIds: null,
});

export function membershipEnforced(): boolean {
  return getLaunchSecret() !== null || Boolean(process.env.TALKWISE_ACADEMY_LAUNCH_SECRET);
}

function isFramed(requestHeaders: Headers): boolean {
  return requestHeaders.get("sec-fetch-dest") === "iframe";
}

export async function resolveAccess(): Promise<AccessDecision> {
  const requestHeaders = await headers();
  const whopSession = await resolveWhopSession(requestHeaders);
  if (whopSession) {
    if (whopSession.entitled) {
      return {
        mode: "whop-embedded",
        allowed: true,
        whopUserId: whopSession.externalUserId,
        embedded: true,
        adultUserId: null,
        householdId: null,
        learnerId: null,
        allowedGameIds: null,
      };
    }
    return {
      ...locked(true),
      mode: "not-entitled",
      whopUserId: whopSession.externalUserId,
    };
  }

  if (isFramed(requestHeaders)) return locked(true);

  const cookieStore = await cookies();

  // Academy is intentionally checked before the legacy browser session. Its
  // credential is learner- and game-scoped and must never inherit broader
  // access from a stale Whop cookie.
  const academySession = await decodeAcademySession(
    cookieStore.get(ACADEMY_SESSION_COOKIE_NAME)?.value,
  );
  if (academySession) {
    return {
      mode: "academy-session",
      allowed: true,
      whopUserId: null,
      embedded: false,
      adultUserId: academySession.adultUserId,
      householdId: academySession.householdId,
      learnerId: academySession.learnerId,
      allowedGameIds: academySession.allowedGameIds,
    };
  }

  if (getLaunchSecret()) {
    const session = await decodeSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
    if (session) {
      if (!needsRevalidation(session)) {
        return {
          mode: "browser-session",
          allowed: true,
          whopUserId: session.whopUserId,
          embedded: false,
          adultUserId: null,
          householdId: null,
          learnerId: null,
          allowedGameIds: null,
        };
      }

      const stillEntitled = await checkWhopEntitlement(session.whopUserId);
      if (stillEntitled === false) {
        cookieStore.delete(SESSION_COOKIE_NAME);
        return locked(false);
      }
      if (stillEntitled === true) {
        const refreshed = await encodeSession({ ...session, verifiedAt: Date.now() });
        if (refreshed) cookieStore.set(SESSION_COOKIE_NAME, refreshed, SESSION_COOKIE_OPTIONS);
      }
      return {
        mode: "browser-session",
        allowed: true,
        whopUserId: session.whopUserId,
        embedded: false,
        adultUserId: null,
        householdId: null,
        learnerId: null,
        allowedGameIds: null,
      };
    }
  }

  if (membershipEnforced()) return locked(false);

  return {
    mode: "unenforced",
    allowed: true,
    whopUserId: null,
    embedded: false,
    adultUserId: null,
    householdId: null,
    learnerId: null,
    allowedGameIds: null,
  };
}

export function canAccessGame(access: AccessDecision, gameId: string): boolean {
  if (!access.allowed) return false;
  return access.allowedGameIds === null || access.allowedGameIds.includes(gameId);
}
