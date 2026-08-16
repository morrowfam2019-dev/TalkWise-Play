import "server-only";
import { Whop } from "@whop/sdk";

let cachedClient: Whop | null = null;

/**
 * Lazily builds the Whop server client from env vars, or returns null when
 * they aren't set — which is the normal case everywhere except the deployed
 * app once Whop is configured. Nothing here ever throws for a missing
 * config; standalone play must keep working with zero Whop credentials.
 */
function getWhopClient(): Whop | null {
  const apiKey = process.env.WHOP_API_KEY;
  const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  if (!apiKey || !appId) return null;

  cachedClient ??= new Whop({ apiKey, appID: appId });
  return cachedClient;
}

export interface WhopVerifiedSession {
  externalUserId: string;
  entitled: boolean;
}

/**
 * Verifies the signed user token Whop forwards to an embedded app request
 * and checks entitlement against the TalkWise Play experience
 * (`WHOP_EXPERIENCE_ID`). Returns null whenever there's nothing to verify —
 * no Whop credentials configured, no token on this request (a plain
 * standalone visit) — so the caller can fall straight back to the inert
 * standalone session.
 */
export async function resolveWhopSession(
  headers: Headers,
): Promise<WhopVerifiedSession | null> {
  const client = getWhopClient();
  if (!client) return null;

  const payload = await client.verifyUserToken(headers, { dontThrow: true });
  if (!payload) return null;

  const experienceId = process.env.WHOP_EXPERIENCE_ID;
  if (!experienceId) return { externalUserId: payload.userId, entitled: false };

  try {
    const access = await client.users.checkAccess(experienceId, {
      id: payload.userId,
    });
    return { externalUserId: payload.userId, entitled: access.has_access };
  } catch {
    // Whop reachable but the access check itself failed (network blip,
    // permission gap) — treat as unentitled rather than crash the page.
    return { externalUserId: payload.userId, entitled: false };
  }
}
