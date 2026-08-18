import "server-only";
import type { Household } from "@/player/types";

/**
 * Server-side home for a member's saved progress.
 *
 * TalkWise Play is moving out of the Whop webview and into whatever browser
 * a family happens to be holding, so `localStorage` can no longer be the
 * only copy — practise on the iPhone, pick it up on the iPad, and the
 * child's coins and unlocks have to follow them.
 *
 * The stored shape is the existing `Household`, which already models
 * Child -> Game. Keying it by the verified Whop member id completes the
 * hierarchy the product needs:
 *
 *     Whop member (family)
 *       └── child profile
 *             └── game id
 *                   └── that game's progress, inventory and records
 *
 * Backed by the same KV REST pair as the launch store. With no KV
 * configured there is no server store at all and the app runs exactly as it
 * does today, on local storage alone — that is a working game, not a broken
 * one, so it is the correct fallback.
 */

export interface StoredProgress {
  household: Household;
  /** Server clock at write time; used for last-write-wins. */
  updatedAt: number;
  /** Schema marker, so a future shape change can migrate rather than guess. */
  version: 2;
}

export interface ProgressStore {
  readonly available: boolean;
  load(memberId: string): Promise<StoredProgress | null>;
  save(memberId: string, progress: StoredProgress): Promise<void>;
}

const KEY_PREFIX = "talkwise-play:progress:";

class UnavailableProgressStore implements ProgressStore {
  readonly available = false;
  async load(): Promise<StoredProgress | null> {
    return null;
  }
  async save(): Promise<void> {
    /* no-op: local storage remains the only copy */
  }
}

class KvProgressStore implements ProgressStore {
  readonly available = true;

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

  async load(memberId: string): Promise<StoredProgress | null> {
    const raw = await this.command(["GET", `${KEY_PREFIX}${memberId}`]);
    if (typeof raw !== "string") return null;
    try {
      return JSON.parse(raw) as StoredProgress;
    } catch {
      return null;
    }
  }

  async save(memberId: string, progress: StoredProgress): Promise<void> {
    await this.command([
      "SET",
      `${KEY_PREFIX}${memberId}`,
      JSON.stringify(progress),
    ]);
  }
}

let cached: ProgressStore | null = null;

export function getProgressStore(): ProgressStore {
  if (cached) return cached;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  cached = url && token ? new KvProgressStore(url, token) : new UnavailableProgressStore();
  return cached;
}
