import "server-only";
import { getLaunchSecret, sign, verify } from "./crypto";

/**
 * The TalkWise Play browser session — what a member actually holds after
 * launching out of Whop into Safari or Chrome.
 *
 * Stored as a signed **HttpOnly** cookie, so it is unreadable to page
 * JavaScript and cannot be lifted out of localStorage by anything running
 * on the page. It contains no Whop API key and no reusable Whop credential:
 * only the member's Whop user id and two timestamps. Possession of it means
 * "TalkWise Play already checked this person's membership", nothing more.
 */

export const SESSION_COOKIE_NAME = "twp_session";

/** How long a session survives without any re-launch from Whop. */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/**
 * How long a membership check is trusted before the server re-asks Whop.
 * Short enough that a cancelled membership loses access the same day;
 * long enough that a family is not bounced back to Whop mid-session.
 */
export const REVALIDATE_AFTER_MS = 12 * 60 * 60 * 1000;

export interface BrowserSession {
  whopUserId: string;
  /** When this session was first created. */
  issuedAt: number;
  /** When entitlement was last confirmed against Whop. */
  verifiedAt: number;
}

export async function encodeSession(
  session: BrowserSession,
): Promise<string | null> {
  const secret = getLaunchSecret();
  if (!secret) return null;
  const payload = `${session.whopUserId}.${session.issuedAt}.${session.verifiedAt}`;
  const signature = await sign(payload, secret);
  return `${payload}.${signature}`;
}

export async function decodeSession(
  raw: string | undefined,
): Promise<BrowserSession | null> {
  if (!raw) return null;
  const secret = getLaunchSecret();
  if (!secret) return null;

  const parts = raw.split(".");
  if (parts.length !== 4) return null;
  const [whopUserId, issuedAtRaw, verifiedAtRaw, signature] = parts;

  const payload = `${whopUserId}.${issuedAtRaw}.${verifiedAtRaw}`;
  if (!(await verify(payload, signature, secret))) return null;

  const issuedAt = Number(issuedAtRaw);
  const verifiedAt = Number(verifiedAtRaw);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(verifiedAt)) return null;
  if (!whopUserId) return null;

  // A session older than its own max age is over, signature or not.
  if (Date.now() - issuedAt > SESSION_MAX_AGE_SECONDS * 1000) return null;

  return { whopUserId, issuedAt, verifiedAt };
}

/** Whether this session's entitlement check has gone stale. */
export function needsRevalidation(session: BrowserSession): boolean {
  return Date.now() - session.verifiedAt > REVALIDATE_AFTER_MS;
}

/** Cookie attributes. `lax` is correct here: the cookie is set by our own
 * `/launch` route on our own origin, and only ever read on top-level
 * navigations to TalkWise Play. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
