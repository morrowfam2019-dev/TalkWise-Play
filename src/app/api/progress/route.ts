import { NextResponse, type NextRequest } from "next/server";
import { resolveAccess } from "@/platform/access";
import { getProgressStore } from "@/platform/progress/store";
import { sanitizeHousehold } from "@/player/storage";

/**
 * A member's saved progress, read and written by the browser they are
 * playing in.
 *
 * Always scoped to the **verified** member on the request — the member id
 * comes from the session cookie or the Whop token, never from the request
 * body, so one family cannot read or overwrite another's save by asking
 * nicely.
 *
 * Everything written is re-sanitised server-side through the same
 * `sanitizeHousehold` the client uses. A hand-crafted POST cannot inject a
 * malformed profile, an unknown game namespace, or an item a child does not
 * own; worst case it overwrites that member's own save with their own junk.
 * Note this is anti-corruption, not anti-cheat: the coin totals themselves
 * are still client-authored, which is the honest tradeoff for a single
 * player practice game with no competitive stakes.
 */

async function resolveMemberId(): Promise<string | null> {
  const access = await resolveAccess();
  if (!access.allowed) return null;
  return access.whopUserId;
}

export async function GET() {
  const store = getProgressStore();
  if (!store.available) {
    return NextResponse.json({ available: false, household: null });
  }

  const memberId = await resolveMemberId();
  if (!memberId) {
    return NextResponse.json({ available: false, household: null });
  }

  try {
    const stored = await store.load(memberId);
    return NextResponse.json({
      available: true,
      household: stored?.household ?? null,
      updatedAt: stored?.updatedAt ?? null,
    });
  } catch (error) {
    console.error("[progress] load failed:", error);
    // A storage blip must never break the game — the client keeps using
    // its local copy and tries again next time.
    return NextResponse.json({ available: false, household: null });
  }
}

export async function PUT(request: NextRequest) {
  const store = getProgressStore();
  if (!store.available) {
    return NextResponse.json({ saved: false, reason: "unavailable" });
  }

  const memberId = await resolveMemberId();
  if (!memberId) {
    return NextResponse.json(
      { saved: false, reason: "unauthorized" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { saved: false, reason: "bad-request" },
      { status: 400 },
    );
  }

  const household = sanitizeHousehold(
    (body as { household?: unknown } | null)?.household,
  );
  if (!household) {
    return NextResponse.json(
      { saved: false, reason: "bad-request" },
      { status: 400 },
    );
  }

  try {
    await store.save(memberId, {
      household,
      updatedAt: Date.now(),
      version: 2,
    });
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("[progress] save failed:", error);
    return NextResponse.json(
      { saved: false, reason: "error" },
      { status: 500 },
    );
  }
}
