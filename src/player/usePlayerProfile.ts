"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  GAME_ADVENTURES,
  GAME_BASKETBALL,
  type GameId,
} from "@/platform/games/registry";
import {
  addChild as addChildToHousehold,
  equipItem,
  householdStore,
  mergeBasketballResult,
  mergeRunResult,
  purchaseItem,
  setActiveChild,
  setAssistMode as setAssistModeOnProfile,
} from "./storage";
import { DEFAULT_PROFILE, type PlayerProfile } from "./types";

/**
 * Reads and writes the active child's profile through the storage
 * abstraction, and exposes household-level child switching.
 *
 * Every game-scoped mutation takes an explicit `gameId`, so a call site
 * physically cannot write into a game it didn't name — that is what keeps
 * GAME-001 and GAME-002 inventories isolated at the type level rather than
 * by convention.
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

  /** Applies a change to whichever child is active right now. */
  const updateActive = useCallback(
    (change: (profile: PlayerProfile) => PlayerProfile) => {
      const current = householdStore.getSnapshot();
      const activeProfile =
        current.children[current.activeChildId] ?? DEFAULT_PROFILE;
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

  const setName = useCallback(
    (name: string) => {
      updateActive((p) => ({ ...p, name: name.slice(0, 20) }));
    },
    [updateActive],
  );

  /** Records a finished GAME-001 adventure run. */
  const recordRun = useCallback(
    (
      levelId: string,
      run: { checkpoints: number; coins: number; completed: boolean },
    ) => {
      updateActive((p) => mergeRunResult(p, levelId, run));
    },
    [updateActive],
  );

  /** Records a finished GAME-002 basketball round. */
  const recordBasketballRound = useCallback(
    (
      soundId: string,
      round: {
        basketballScore: number;
        basketsMade: number;
        bestStreak: number;
        coinsEarned: number;
      },
    ) => {
      updateActive((p) => mergeBasketballResult(p, soundId, round));
    },
    [updateActive],
  );

  /**
   * Buys a shop item into `gameId`'s inventory and equips it. Returns false
   * if it wasn't affordable or was already owned in that game.
   */
  const buyItem = useCallback(
    (gameId: GameId, item: { id: string; price: number; kind: string }) => {
      const current = householdStore.getSnapshot();
      const activeProfile =
        current.children[current.activeChildId] ?? DEFAULT_PROFILE;
      const { profile: next, bought } = purchaseItem(activeProfile, gameId, item);
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

  /** Equips an owned item within one game. */
  const equip = useCallback(
    (gameId: GameId, kind: string, id: string | null) => {
      updateActive((p) => equipItem(p, gameId, kind, id));
    },
    [updateActive],
  );

  /** Turns the microphone path on or off for every future challenge. */
  const setMicEnabled = useCallback(
    (micEnabled: boolean) => {
      updateActive((p) => ({ ...p, micEnabled }));
    },
    [updateActive],
  );

  /** Turns movement/listening assists on or off for every future run. */
  const setAssistMode = useCallback(
    (assistMode: boolean) => {
      updateActive((p) => setAssistModeOnProfile(p, assistMode));
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
    /** GAME-001's isolated slice, for convenience at Adventure call sites. */
    adventures: profile.games[GAME_ADVENTURES],
    /** GAME-002's isolated slice, for convenience at Basketball call sites. */
    basketball: profile.games[GAME_BASKETBALL],
    setName,
    recordRun,
    recordBasketballRound,
    buyItem,
    equip,
    setMicEnabled,
    setAssistMode,
    children,
    activeChildId: household.activeChildId,
    switchChild,
    addChild,
  };
}
