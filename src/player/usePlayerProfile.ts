"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  addChild as addChildToHousehold,
  householdStore,
  mergeRunResult,
  setActiveChild,
} from "./storage";
import { DEFAULT_PROFILE } from "./types";

/**
 * Reads and writes the active child's profile through the storage
 * abstraction, and exposes household-level child switching.
 *
 * Backed by `useSyncExternalStore`, so saved progress appears as soon as the
 * client takes over and every consumer of the profile stays in sync.
 */
export function usePlayerProfile() {
  const household = useSyncExternalStore(
    householdStore.subscribe,
    householdStore.getSnapshot,
    householdStore.getServerSnapshot,
  );

  const profile = household.children[household.activeChildId] ?? DEFAULT_PROFILE;

  const setName = useCallback((name: string) => {
    const current = householdStore.getSnapshot();
    const activeProfile = current.children[current.activeChildId] ?? DEFAULT_PROFILE;
    householdStore.save({
      ...current,
      children: {
        ...current.children,
        [current.activeChildId]: { ...activeProfile, name: name.slice(0, 20) },
      },
    });
  }, []);

  const recordRun = useCallback(
    (
      levelId: string,
      run: { checkpoints: number; coins: number; completed: boolean },
    ) => {
      const current = householdStore.getSnapshot();
      const activeProfile = current.children[current.activeChildId] ?? DEFAULT_PROFILE;
      householdStore.save({
        ...current,
        children: {
          ...current.children,
          [current.activeChildId]: mergeRunResult(activeProfile, levelId, run),
        },
      });
    },
    [],
  );

  const switchChild = useCallback((id: string) => {
    householdStore.save(setActiveChild(householdStore.getSnapshot(), id));
  }, []);

  /** Adds a new child profile and switches to it. Returns the new child's id. */
  const addChild = useCallback((name: string) => {
    const current = householdStore.getSnapshot();
    const { household: next, id } = addChildToHousehold(current, name);
    householdStore.save(next);
    return id;
  }, []);

  const children = household.order.map((id) => ({
    id,
    name: household.children[id]?.name ?? "",
  }));

  return {
    profile,
    setName,
    recordRun,
    children,
    activeChildId: household.activeChildId,
    switchChild,
    addChild,
  };
}
