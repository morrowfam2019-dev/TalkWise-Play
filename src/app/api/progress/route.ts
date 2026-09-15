import { NextResponse, type NextRequest } from "next/server";
import { resolveAccess } from "@/platform/access";
import { getProgressStore } from "@/platform/progress/store";
import { sanitizeHousehold } from "@/player/storage";

/**
 * Server-backed TalkWise Play save transport.
 *
 * Whop-era sessions remain keyed to their verified member id. Academy
 * sessions are keyed to the verified Academy learner id from the signed
 * HttpOnly session, never to an id supplied by the browser. This preserves
 * the existing Play save format while preventing one learner from asking for
 * another learner's save.
 */
async function resolveProgressIdentity(): Promise<string | null> {
  const access = await resolveAccess();
  if (!access.allowed) return null;
  if (access.mode === "academy-session" && access.learnerId) {
    return `academy:${access.learnerId}`;
  }
  if (access.whopUserId) return `whop:${access.whopUserId}`;
  return null;
}

export async function GET() {
  const store = getProgressStore();
  if (!store.available) {
    return NextResponse.json({ available: false, household: null });
  }

  const identity = await resolveProgressIdentity();
  if (!identity) {
    return NextResponse.json({ available: false, household: null });
  }

  try {
    const stored = await store.load(identity);
    return NextResponse.json({
      available: true,
      household: stored?.household ?? null,
      updatedAt: stored?.updatedAt ?? null,
    });
  } catch (error) {
    console.error("[progress] load failed:", error);
    return NextResponse.json({ available: false, household: null });
  }
}

export async function PUT(request: NextRequest) {
  const store = getProgressStore();
  if (!store.available) {
    return NextResponse.json({ saved: false, reason: "unavailable" });
  }

  const identity = await resolveProgressIdentity();
  if (!identity) {
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
    await store.save(identity, {
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
