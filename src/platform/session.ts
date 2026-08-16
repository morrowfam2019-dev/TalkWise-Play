/**
 * Platform integration boundary.
 *
 * TalkWise Play runs standalone by default. When embedded in Whop with a
 * verified member, `RootLayout` resolves a real session server-side (see
 * `src/platform/whop.ts`) and threads it down via `PlatformSessionProvider`.
 * Nothing in the game engine, speech content, or player data imports a
 * platform SDK directly — this module and its provider are the only seam —
 * so the game keeps running outside any host exactly as before.
 */

export type PlatformKind = "standalone" | "embedded";

export interface PlatformSession {
  /** Where the game is running. */
  kind: PlatformKind;
  /** Stable player identity, once a platform provides one. Null while local. */
  externalUserId: string | null;
  /** Whether the host has granted access. Always true while unintegrated —
   * entitlement checks gate content, never the ability to run the app. */
  entitled: boolean;
}

const STANDALONE_SESSION: PlatformSession = {
  kind: "standalone",
  externalUserId: null,
  entitled: true,
};

/**
 * Client-only fallback: detects an iframe host without any verification.
 * Used only where `usePlatformSession` can't reach a `PlatformSessionProvider`
 * (there always is one from `RootLayout`, so this is a safety net, not the
 * primary path) — it can say "probably embedded" but never who the player is
 * or whether they're entitled, which is why it always reports `entitled: true`
 * rather than guess.
 */
export function getPlatformSession(): PlatformSession {
  if (typeof window === "undefined") return STANDALONE_SESSION;

  let embedded = false;
  try {
    embedded = window.self !== window.top;
  } catch {
    // Cross-origin frame access throws; that itself means we are embedded.
    embedded = true;
  }

  return {
    ...STANDALONE_SESSION,
    kind: embedded ? "embedded" : "standalone",
  };
}

/**
 * Converts a server-verified Whop session (or null, when there was nothing
 * to verify) into the shape the rest of the app reads. This is the one place
 * that decides what "entitled" means from real Whop data.
 */
export function toPlatformSession(
  verified: { externalUserId: string; entitled: boolean } | null,
): PlatformSession {
  if (!verified) return STANDALONE_SESSION;
  return {
    kind: "embedded",
    externalUserId: verified.externalUserId,
    entitled: verified.entitled,
  };
}
