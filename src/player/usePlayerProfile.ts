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
  markMapCelebration,
  mergeBasketballResult,
  mergeExplorerCoins,
  mergeQuestResult,
  mergeRunResult,
  mergeStationResult,
  purchaseItem,
  setActiveChild,
  setAssistMode as setAssistModeOnProfile,
} from "./storage";
import type { BasketballRoundOutcome } from "./games/basketball";
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

  /**
   * Records one turn at a GAME-001 Beginner sound station.
   *
   * Called per turn rather than per session: an Explorer map has no "run"
   * to end, and a child who wanders off mid-map should keep everything they
   * practised. `completed` is true whether the microphone heard them or
   * they tapped the button — Beginner records participation, not accuracy.
   */
  const recordStationTurn = useCallback(
    (
      mapId: string,
      soundId: string,
      turn: { completed: boolean; coins: number },
    ) => {
      updateActive((p) => mergeStationResult(p, mapId, soundId, turn));
    },
    [updateActive],
  );

  /**
   * Banks a coin picked up in a Beginner map, immediately.
   *
   * An explorer map never ends, so there is no results screen to bank
   * pickups on — a child who wanders off with ten coins in their pocket
   * should keep them.
   */
  const recordExplorerCoins = useCallback(
    (coins: number) => {
      updateActive((p) => mergeExplorerCoins(p, coins));
    },
    [updateActive],
  );

  /** Records that a child reached a Beginner map's celebration. Idempotent. */
  const recordMapCelebration = useCallback(
    (mapId: string) => {
      updateActive((p) => markMapCelebration(p, mapId));
    },
    [updateActive],
  );

  /** Records a finished GAME-001 Expert sentence quest run. */
  const recordQuestRun = useCallback(
    (
      questId: string,
      run: { scenes: number; coins: number; completed: boolean },
    ) => {
      updateActive((p) => mergeQuestResult(p, questId, run));
    },
    [updateActive],
  );

  /**
   * Records a finished GAME-002 basketball round, whichever mode it was.
   *
   * One entry point for every mode rather than one per mode: the outcome
   * carries its own `mode`, so adding a fourth Basketball mode needs no
   * change here at all.
   */
  const recordBasketballRound = useCallback(
    (round: BasketballRoundOutcome & { coinsEarned: number }) => {
      updateActive((p) => mergeBasketballResult(p, round));
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
    recordStationTurn,
    recordExplorerCoins,
    recordMapCelebration,
    recordQuestRun,
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
