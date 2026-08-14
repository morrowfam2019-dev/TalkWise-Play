/**
 * Platform integration boundary — INACTIVE IN PHASE 1.
 *
 * TalkWise Play runs standalone. When membership-gated hosting (Whop or any
 * other platform) arrives, only this module changes: it resolves who the
 * player is and what they may access. Nothing in the game engine, speech
 * content, or player data imports a platform SDK, so the game keeps running
 * outside any host.
 */

export type PlatformKind = "standalone" | "embedded";

export interface PlatformSession {
  /** Where the game is running. Phase 1 is always effectively standalone. */
  kind: PlatformKind;
  /** Stable player identity, once a platform provides one. Null while local. */
  externalUserId: string | null;
  /** Whether the host has granted access. Always true while unintegrated. */
  entitled: boolean;
}

const STANDALONE_SESSION: PlatformSession = {
  kind: "standalone",
  externalUserId: null,
  entitled: true,
};

/**
 * Resolves the current session. Phase 1 always returns the standalone session;
 * detecting an iframe host is informational only and never gates play.
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
