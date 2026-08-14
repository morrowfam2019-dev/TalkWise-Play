"use client";

import { useCallback, useSyncExternalStore } from "react";
import { mergeRunResult, progressStore } from "./storage";

/**
 * Reads and writes the player profile through the storage abstraction.
 *
 * Backed by `useSyncExternalStore`, so saved progress appears as soon as the
 * client takes over and every consumer of the profile stays in sync.
 */
export function usePlayerProfile() {
  const profile = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    progressStore.getServerSnapshot,
  );

  const setName = useCallback((name: string) => {
    const current = progressStore.getSnapshot();
    progressStore.save({ ...current, name: name.slice(0, 20) });
  }, []);

  const recordRun = useCallback(
    (
      levelId: string,
      run: { checkpoints: number; coins: number; completed: boolean },
    ) => {
      progressStore.save(mergeRunResult(progressStore.getSnapshot(), levelId, run));
    },
    [],
  );

  return { profile, setName, recordRun };
}
