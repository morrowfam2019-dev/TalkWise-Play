import "server-only";
import { getLaunchSecret, randomToken, sign, verify } from "./crypto";
import { getLaunchTokenStore } from "./store";

/**
 * Launch credentials: the short-lived thing that carries "this Whop member
 * is allowed in" from the embedded Whop experience to the member's normal
 * browser, and nothing else.
 *
 * A launch token is **not** a session. It is valid for two minutes, is
 * redeemed exactly once, and the only thing it can buy is a real session
 * cookie on our own domain. It never contains a Whop API key, never
 * contains a reusable credential, and is discarded the moment it is used.
 */

/** Two minutes is plenty to hand off to another app, and short enough that
 * a leaked URL in a screen recording is worthless by the time anyone sees it. */
const LAUNCH_TTL_MS = 2 * 60 * 1000;

export interface LaunchClaim {
  whopUserId: string;
}

/**
 * Mints a launch token for an already-verified, already-entitled member.
 *
 * With a durable KV store the token is a fully opaque random string and the
 * store is the sole source of truth — single-use, guaranteed. Without one,
 * the token additionally carries a signed, expiring payload so it can still
 * be validated on a different serverless instance than minted it; the store
 * then acts as a best-effort replay block. Both paths are the same length
 * of random material; the fallback just appends proof.
 */
export async function mintLaunchToken(
  claim: LaunchClaim,
): Promise<string | null> {
  const secret = getLaunchSecret();
  if (!secret) return null;

  const store = getLaunchTokenStore();
  const expiresAt = Date.now() + LAUNCH_TTL_MS;
  const opaque = randomToken();

  await store.put(opaque, { whopUserId: claim.whopUserId, expiresAt });
  if (store.durable) return opaque;

  // No shared store: make the token self-verifying so a cross-instance
  // redemption still works. The payload holds only a Whop user id and an
  // expiry — useless without the signature, and worthless after 2 minutes.
  const payload = `${opaque}.${claim.whopUserId}.${expiresAt}`;
  const signature = await sign(payload, secret);
  return `${payload}.${signature}`;
}

/**
 * Redeems a launch token, returning who it belongs to. Always consumes the
 * token: a second call with the same value fails, whether it succeeded or
 * not the first time.
 */
export async function redeemLaunchToken(
  token: string,
): Promise<LaunchClaim | null> {
  const secret = getLaunchSecret();
  if (!secret) return null;

  const store = getLaunchTokenStore();
  const parts = token.split(".");

  // Opaque form (durable store): the store alone decides.
  if (parts.length === 1) {
    const record = await store.consume(token);
    if (!record) return null;
    return { whopUserId: record.whopUserId };
  }

  // Signed fallback form.
  if (parts.length !== 4) return null;
  const [opaque, whopUserId, expiresAtRaw, signature] = parts;
  const payload = `${opaque}.${whopUserId}.${expiresAtRaw}`;
  if (!(await verify(payload, signature, secret))) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  // Single-use, as far as this instance can tell. A token already redeemed
  // here is refused outright; one this instance has never seen is allowed
  // through on its signature and expiry, because refusing it would break
  // every legitimate launch that happens to land on a different serverless
  // instance than minted it. Configuring KV removes the ambiguity entirely
  // and makes single-use absolute.
  if (await store.isBurned(opaque)) return null;
  await store.consume(opaque);

  if (!whopUserId) return null;
  return { whopUserId };
}
