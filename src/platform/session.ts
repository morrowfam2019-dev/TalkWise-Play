/** Platform-neutral session boundary for TalkWise Play. */
export type PlatformKind = "standalone" | "embedded" | "academy";

export interface PlatformSession {
  kind: PlatformKind;
  externalUserId: string | null;
  entitled: boolean;
  learnerId: string | null;
  householdId: string | null;
  /** null = unrestricted legacy session; array = exact Academy game scope. */
  allowedGameIds: string[] | null;
}

const STANDALONE_SESSION: PlatformSession = {
  kind: "standalone",
  externalUserId: null,
  entitled: true,
  learnerId: null,
  householdId: null,
  allowedGameIds: null,
};

export function getPlatformSession(): PlatformSession {
  if (typeof window === "undefined") return STANDALONE_SESSION;
  let embedded = false;
  try {
    embedded = window.self !== window.top;
  } catch {
    embedded = true;
  }
  return { ...STANDALONE_SESSION, kind: embedded ? "embedded" : "standalone" };
}

export function toPlatformSession(access: {
  mode?: string;
  whopUserId: string | null;
  adultUserId?: string | null;
  householdId?: string | null;
  learnerId?: string | null;
  allowedGameIds?: string[] | null;
  embedded: boolean;
  allowed: boolean;
}): PlatformSession {
  if (access.mode === "academy-session") {
    return {
      kind: "academy",
      externalUserId: access.adultUserId ?? null,
      entitled: access.allowed,
      learnerId: access.learnerId ?? null,
      householdId: access.householdId ?? null,
      allowedGameIds: access.allowedGameIds ?? [],
    };
  }
  if (!access.whopUserId) return STANDALONE_SESSION;
  return {
    kind: access.embedded ? "embedded" : "standalone",
    externalUserId: access.whopUserId,
    entitled: access.allowed,
    learnerId: null,
    householdId: null,
    allowedGameIds: null,
  };
}
