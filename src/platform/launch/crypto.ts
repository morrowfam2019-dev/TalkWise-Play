import "server-only";

/**
 * Signing primitives for the launch bridge and the browser session cookie.
 *
 * Uses Web Crypto (HMAC-SHA256), which exists in both the Node and Edge
 * runtimes, so nothing here pins the app to one deployment target. No
 * third-party crypto dependency, and no hand-rolled algorithm.
 */

const encoder = new TextEncoder();

/**
 * The one secret this whole feature depends on. Absent, the launch bridge
 * cannot mint or verify anything — which is why membership enforcement is
 * deliberately disabled until it is configured (see `platform/access.ts`).
 * A gate that cannot validate its own tokens must fail open to a working
 * game, not closed to a broken one.
 */
export function getLaunchSecret(): string | null {
  const secret = process.env.TALKWISE_LAUNCH_SECRET;
  if (!secret || secret.length < 32) return null;
  return secret;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

/** Cryptographically random opaque id, url-safe. */
export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export async function sign(payload: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

/**
 * Constant-time-ish verification: delegates the comparison to Web Crypto's
 * own `verify` rather than comparing strings, so a mismatch can't be timed.
 */
export async function verify(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const bytes = fromBase64Url(signature);
  if (!bytes) return false;
  const key = await hmacKey(secret);
  try {
    return await crypto.subtle.verify(
      "HMAC",
      key,
      bytes as unknown as ArrayBuffer,
      encoder.encode(payload),
    );
  } catch {
    return false;
  }
}
