"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  addChild as addChildToHousehold,
  equipItem,
  householdStore,
  mergeRunResult,
  purchaseItem,
  setActiveChild,
} from "./storage";
import { DEFAULT_PROFILE, type PlayerProfile } from "./types";

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

  /** Applies a change to whichever child is active right now. */
  const updateActive = useCallback(
    (change: (profile: PlayerProfile) => PlayerProfile) => {
      const current = householdStore.getSnapshot();
      const activeProfile = current.children[current.activeChildId] ?? DEFAULT_PROFILE;
      householdStore.save({
        ...current,
        children: {
          ...current.children,
          [current.activeChildId]: change(activeProfile),
        },
      });
    },
    [],
  );

  /** Buys a shop item and equips it. Returns false if it wasn't affordable. */
  const buyItem = useCallback(
    (item: { id: string; price: number; kind: "character" | "aura" | "boost" }) => {
      const current = householdStore.getSnapshot();
      const activeProfile = current.children[current.activeChildId] ?? DEFAULT_PROFILE;
      const { profile: next, bought } = purchaseItem(activeProfile, item);
      if (bought) {
        householdStore.save({
          ...current,
          children: { ...current.children, [current.activeChildId]: next },
        });
      }
      return bought;
    },
    [],
  );

  /** Turns the microphone path on or off for every future challenge. */
  const setMicEnabled = useCallback(
    (micEnabled: boolean) => {
      updateActive((profile) => ({ ...profile, micEnabled }));
    },
    [updateActive],
  );

  const equip = useCallback(
    (kind: "character" | "aura" | "boost", id: string | null) => {
      updateActive((p) => equipItem(p, kind, id));
    },
    [updateActive],
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
    buyItem,
    equip,
    setMicEnabled,
    children,
    activeChildId: household.activeChildId,
    switchChild,
    addChild,
  };
}
