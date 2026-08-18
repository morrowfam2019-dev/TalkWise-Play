"use client";

import { useEffect, useRef } from "react";
import { householdStore, sanitizeHousehold } from "./storage";
import type { Household } from "./types";

/**
 * Keeps a member's progress in step between this browser and the server.
 *
 * Renders nothing. Mounted once inside the protected layout, so it only
 * runs for someone who is actually allowed to be here.
 *
 * ## The rule that prevents duplicated rewards
 *
 * The server is **canonical whenever it has anything**. Local storage is
 * only ever uploaded when the server has no save for this member at all —
 * a genuine first migration. The two copies are never merged and coin
 * totals are never added together, which is exactly how a "migration" could
 * otherwise mint currency by running twice. Replacing wholesale means a
 * repeat migration is a no-op rather than an exploit.
 *
 * After that first exchange it is plain write-through: local stays the fast
 * copy the game reads, and every change is pushed up debounced.
 */
const PUSH_DEBOUNCE_MS = 1500;

export function ProgressSync() {
  const readyRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const lastPushedRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const push = async (household: Household) => {
      const serialized = JSON.stringify(household);
      if (serialized === lastPushedRef.current) return;
      lastPushedRef.current = serialized;
      try {
        await fetch("/api/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ household }),
        });
      } catch {
        // Offline or a blip. Local storage still has everything; the next
        // change pushes again, so nothing is lost.
      }
    };

    const bootstrap = async () => {
      try {
        const response = await fetch("/api/progress", { cache: "no-store" });
        if (!response.ok) return;

        const body = (await response.json()) as {
          available?: boolean;
          household?: unknown;
        };
        if (cancelled || !body.available) return;

        const serverHousehold = sanitizeHousehold(body.household);

        if (serverHousehold) {
          // Server wins. Adopt it as-is rather than merging.
          lastPushedRef.current = JSON.stringify(serverHousehold);
          householdStore.save(serverHousehold);
        } else {
          // Nothing stored yet — this member's first sync. Seed the server
          // from whatever this device already has.
          await push(householdStore.getSnapshot());
        }
      } catch {
        // Server unreachable — carry on entirely on local storage.
      } finally {
        if (!cancelled) readyRef.current = true;
      }
    };

    void bootstrap();

    const unsubscribe = householdStore.subscribe(() => {
      if (!readyRef.current) return;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        void push(householdStore.getSnapshot());
      }, PUSH_DEBOUNCE_MS);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
