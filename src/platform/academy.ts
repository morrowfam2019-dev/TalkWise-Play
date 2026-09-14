import "server-only";
import { fromBase64Url, sign, toBase64Url, verify } from "./launch/crypto";

export const ACADEMY_SESSION_COOKIE_NAME = "twp_academy_session";
export const ACADEMY_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
const MAX_LAUNCH_WINDOW_MS = 2 * 60 * 1000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface AcademyLaunchClaim {
  v: 1;
  iss: "talkwise-academy";
  aud: "talkwise-play";
  sub: string;
  household_id: string;
  learner_id: string;
  game_id: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface AcademyBrowserSession {
  source: "academy";
  adultUserId: string;
  householdId: string;
  learnerId: string;
  allowedGameIds: string[];
  issuedAt: number;
  expiresAt: number;
}

function getAcademySecret(): string | null {
  const secret = process.env.TALKWISE_ACADEMY_LAUNCH_SECRET;
  if (!secret || secret.length < 32) return null;
  return secret;
}

function decodePayload<T>(encoded: string): T | null {
  const bytes = fromBase64Url(encoded);
  if (!bytes) return null;
  try {
    return JSON.parse(decoder.decode(bytes)) as T;
  } catch {
    return null;
  }
}

const burnedNonces = new Map<string, number>();

async function claimNonce(jti: string, expiresAt: number): Promise<boolean> {
  const now = Date.now();
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  const ttlSeconds = Math.max(1, Math.ceil((expiresAt - now) / 1000));

  if (kvUrl && kvToken) {
    const response = await fetch(kvUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${kvToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["SET", `talkwise-play:academy-launch:${jti}`, "1", "NX", "EX", ttlSeconds]),
      cache: "no-store",
    });
    if (!response.ok) return false;
    const body = (await response.json()) as { result?: unknown };
    return body.result === "OK";
  }

  for (const [key, expiry] of burnedNonces) {
    if (expiry <= now) burnedNonces.delete(key);
  }
  if (burnedNonces.has(jti)) return false;
  burnedNonces.set(jti, expiresAt);
  return true;
}

export async function redeemAcademyLaunchToken(token: string): Promise<AcademyLaunchClaim | null> {
  const secret = getAcademySecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  if (!(await verify(encoded, signature, secret))) return null;

  const claim = decodePayload<AcademyLaunchClaim>(encoded);
  if (!claim) return null;

  const now = Date.now();
  if (
    claim.v !== 1 ||
    claim.iss !== "talkwise-academy" ||
    claim.aud !== "talkwise-play" ||
    !claim.sub ||
    !claim.household_id ||
    !claim.learner_id ||
    !/^GAME-[0-9]{3}$/.test(claim.game_id) ||
    !claim.jti ||
    !Number.isFinite(claim.iat) ||
    !Number.isFinite(claim.exp) ||
    claim.iat > now + 30_000 ||
    claim.exp <= now ||
    claim.exp - claim.iat > MAX_LAUNCH_WINDOW_MS
  ) {
    return null;
  }

  if (!(await claimNonce(claim.jti, claim.exp))) return null;
  return claim;
}

export async function encodeAcademySession(claim: AcademyLaunchClaim): Promise<string | null> {
  const secret = getAcademySecret();
  if (!secret) return null;
  const issuedAt = Date.now();
  const session: AcademyBrowserSession = {
    source: "academy",
    adultUserId: claim.sub,
    householdId: claim.household_id,
    learnerId: claim.learner_id,
    allowedGameIds: [claim.game_id],
    issuedAt,
    expiresAt: issuedAt + ACADEMY_SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encoded = toBase64Url(encoder.encode(JSON.stringify(session)));
  const signature = await sign(encoded, secret);
  return `${encoded}.${signature}`;
}

export async function decodeAcademySession(raw: string | undefined): Promise<AcademyBrowserSession | null> {
  if (!raw) return null;
  const secret = getAcademySecret();
  if (!secret) return null;
  const parts = raw.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  if (!(await verify(encoded, signature, secret))) return null;
  const session = decodePayload<AcademyBrowserSession>(encoded);
  if (!session || session.source !== "academy") return null;
  if (!session.adultUserId || !session.householdId || !session.learnerId) return null;
  if (!Array.isArray(session.allowedGameIds) || session.allowedGameIds.length < 1) return null;
  if (!session.allowedGameIds.every((id) => /^GAME-[0-9]{3}$/.test(id))) return null;
  if (!Number.isFinite(session.issuedAt) || !Number.isFinite(session.expiresAt)) return null;
  if (session.expiresAt <= Date.now()) return null;
  if (session.expiresAt - session.issuedAt > ACADEMY_SESSION_MAX_AGE_SECONDS * 1000 + 1000) return null;
  return session;
}

export const ACADEMY_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: ACADEMY_SESSION_MAX_AGE_SECONDS,
};
