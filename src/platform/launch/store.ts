import "server-only";

/**
 * Where single-use launch tokens are remembered between being minted (inside
 * Whop) and being redeemed (in the external browser).
 *
 * Two implementations, chosen automatically:
 *
 * - **KV store** (`KV_REST_API_URL` + `KV_REST_API_TOKEN`, the Vercel KV /
 *   Upstash Redis REST pair). Tokens are fully opaque random strings held
 *   server-side and deleted the instant they are redeemed, so a token is
 *   genuinely single-use across every serverless instance. This is the
 *   production-grade path.
 *
 * - **In-memory fallback**, used when no KV is configured. Serverless
 *   instances do not share memory, so a token minted on one instance may be
 *   redeemed on another — which is why the fallback does not rely on the
 *   store alone for validity (see `tokens.ts`: without KV the token carries
 *   its own signature and a 2-minute expiry, and the memory store is a
 *   best-effort replay block rather than the source of truth).
 *
 * Configuring KV is the difference between "single-use, guaranteed" and
 * "single-use on this instance, 2-minute window otherwise", so it is listed
 * as a founder action in the docs.
 */

export interface LaunchRecord {
  whopUserId: string;
  expiresAt: number;
}

export interface LaunchTokenStore {
  readonly durable: boolean;
  put(token: string, record: LaunchRecord): Promise<void>;
  /** Reads and deletes in one step. Returns null if unknown or expired. */
  consume(token: string): Promise<LaunchRecord | null>;
  /**
   * Whether this token was definitely redeemed already **on this instance**.
   *
   * Only meaningful for the non-durable store, where `consume` returning
   * null is ambiguous — it means either "already used here" or "minted on a
   * different instance and never seen here". Those must be told apart:
   * the first has to be refused, the second has to be allowed through to
   * signature checking or cross-instance launches would simply break.
   */
  isBurned(token: string): Promise<boolean>;
}

const KEY_PREFIX = "talkwise-play:launch:";

class MemoryLaunchTokenStore implements LaunchTokenStore {
  readonly durable = false;
  private records = new Map<string, LaunchRecord>();
  /** Tokens already redeemed here, kept until they would have expired
   * anyway, so a replay on this instance is recognised rather than merely
   * "not found". */
  private burned = new Map<string, number>();

  private sweep(): void {
    const now = Date.now();
    for (const [key, value] of this.records) {
      if (value.expiresAt < now) this.records.delete(key);
    }
    for (const [key, expiresAt] of this.burned) {
      if (expiresAt < now) this.burned.delete(key);
    }
  }

  async put(token: string, record: LaunchRecord): Promise<void> {
    this.records.set(token, record);
    // Opportunistic sweep so a long-lived warm instance can't grow forever.
    if (this.records.size + this.burned.size > 500) this.sweep();
  }

  async consume(token: string): Promise<LaunchRecord | null> {
    const record = this.records.get(token);
    if (!record) return null;
    this.records.delete(token);
    this.burned.set(token, record.expiresAt);
    if (record.expiresAt < Date.now()) return null;
    return record;
  }

  async isBurned(token: string): Promise<boolean> {
    const expiresAt = this.burned.get(token);
    if (expiresAt === undefined) return false;
    if (expiresAt < Date.now()) {
      this.burned.delete(token);
      return false;
    }
    return true;
  }
}

/** Vercel KV / Upstash Redis over their REST API — no extra dependency. */
class KvLaunchTokenStore implements LaunchTokenStore {
  readonly durable = true;

  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  private async command(parts: (string | number)[]): Promise<unknown> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parts),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`KV command failed: ${response.status}`);
    const body = (await response.json()) as { result?: unknown };
    return body.result;
  }

  async put(token: string, record: LaunchRecord): Promise<void> {
    const ttlSeconds = Math.max(
      1,
      Math.ceil((record.expiresAt - Date.now()) / 1000),
    );
    await this.command([
      "SET",
      `${KEY_PREFIX}${token}`,
      JSON.stringify(record),
      "EX",
      ttlSeconds,
    ]);
  }

  async consume(token: string): Promise<LaunchRecord | null> {
    // GETDEL is atomic: two racing redemptions cannot both win.
    const raw = await this.command(["GETDEL", `${KEY_PREFIX}${token}`]);
    if (typeof raw !== "string") return null;
    try {
      const record = JSON.parse(raw) as LaunchRecord;
      if (record.expiresAt < Date.now()) return null;
      return record;
    } catch {
      return null;
    }
  }

  /** Never needed: with a shared store, `consume` returning null already
   * means "not redeemable", whether that is because it was used or because
   * it never existed. There is no ambiguity to resolve. */
  async isBurned(): Promise<boolean> {
    return false;
  }
}

let cached: LaunchTokenStore | null = null;

export function getLaunchTokenStore(): LaunchTokenStore {
  if (cached) return cached;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  cached = url && token ? new KvLaunchTokenStore(url, token) : new MemoryLaunchTokenStore();
  return cached;
}
