/**
 * Player data model.
 *
 * Two levels, deliberately:
 *
 * - **Platform-wide** fields live directly on `PlayerProfile`: the child's
 *   name, the coin wallet, the practice streak, and the accessibility
 *   settings (microphone, assist). These belong to the child, not to any one
 *   game.
 * - **Per-game** state lives under `games[GAME_ID]`, one isolated slice per
 *   registered TalkWise Play game. Inventory, shop ownership, equipped
 *   loadout, progress, and records are all namespaced this way, so a
 *   basketball jersey can never appear in the Adventures wardrobe and
 *   finishing an adventure can never touch a basketball high score.
 *
 * ## The coin decision (documented deliberately)
 *
 * Coins are a **universal TalkWise Play wallet**, not per-game currency.
 * That is the behaviour the game already shipped with, and this refactor
 * preserves it exactly rather than silently redenominating anyone's savings:
 * coins earned in Adventures can be spent in the Basketball shop and vice
 * versa. What is *not* shared is what those coins buy — every purchase lands
 * in the buying game's own inventory. If per-game currency is ever wanted,
 * that is a product decision and an explicit migration, not a refactor.
 *
 * Kept free of both the game engines and the speech content so it can be
 * backed by a server without touching gameplay.
 */

import {
  GAME_ADVENTURES,
  GAME_BASKETBALL,
  GAME_BUBBLE_BLAST,
  GAME_COLOR_SHAPE_HUNT,
  GAME_GUESS_THE_SOUND,
  GAME_SOUND_MATCH,
  GAME_STORY_BUILDER,
  type GameId,
} from "@/platform/games/registry";
import {
  DEFAULT_ADVENTURES_STATE,
  type AdventuresState,
} from "./games/adventures";
import {
  DEFAULT_BASKETBALL_STATE,
  type BasketballState,
} from "./games/basketball";
import {
  DEFAULT_MINIGAME_STATE,
  type MiniGameState,
} from "./games/minigames";

/**
 * Every registered game's slice, keyed by permanent game id.
 *
 * The six mini-games share the `MiniGameState` *shape* but each has its own
 * key, so a Bubble Blast personal best and a Story Builder personal best are
 * different objects that no function can confuse for each other — §20's
 * "do NOT mix individual mini-game progression together", enforced by the
 * type rather than by convention.
 */
export interface GameStates {
  [GAME_ADVENTURES]: AdventuresState;
  [GAME_BASKETBALL]: BasketballState;
  [GAME_BUBBLE_BLAST]: MiniGameState;
  [GAME_SOUND_MATCH]: MiniGameState;
  [GAME_COLOR_SHAPE_HUNT]: MiniGameState;
  [GAME_GUESS_THE_SOUND]: MiniGameState;
  [GAME_STORY_BUILDER]: MiniGameState;
}

/** Everything persisted about one child. */
export interface PlayerProfile {
  /** Kid-facing display name. Empty until they choose one. */
  name: string;
  /** Lifetime coin total across every game. Never decreases — it's the
   * record of everything earned, and achievements measure against it. */
  totalCoins: number;
  /** Lifetime coins spent in any shop. Spendable balance is the difference,
   * so buying something never erases the achievement of having earned it. */
  spentCoins: number;
  /** Consecutive calendar days (local time) with at least one run played. */
  currentStreak: number;
  /** Longest currentStreak ever reached. */
  bestStreak: number;
  /** ISO date (YYYY-MM-DD, local) of the last day a run was played. */
  lastPlayedDate: string | null;
  /**
   * Whether speech challenges listen through the microphone. Turning this
   * off falls back to the manual "I said it" button, which is the whole
   * point: a bad microphone must never be able to block a child from
   * moving on. Sticky, so it is answered once rather than every checkpoint.
   * Platform-wide — it describes the child's device and voice, not a game.
   */
  micEnabled: boolean;
  /**
   * Easy-mode movement and listening assists: more forgiving jump timing and
   * a longer window to speak before an attempt times out. Never touches
   * checkpoint count or which words are asked — those stay level content,
   * not something a difficulty setting can shorten.
   */
  assistMode: boolean;
  /** Per-game isolated state. */
  games: GameStates;
}

export const DEFAULT_PROFILE: PlayerProfile = {
  name: "",
  totalCoins: 0,
  spentCoins: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedDate: null,
  micEnabled: true,
  assistMode: false,
  games: {
    [GAME_ADVENTURES]: DEFAULT_ADVENTURES_STATE,
    [GAME_BASKETBALL]: DEFAULT_BASKETBALL_STATE,
    [GAME_BUBBLE_BLAST]: DEFAULT_MINIGAME_STATE,
    [GAME_SOUND_MATCH]: DEFAULT_MINIGAME_STATE,
    [GAME_COLOR_SHAPE_HUNT]: DEFAULT_MINIGAME_STATE,
    [GAME_GUESS_THE_SOUND]: DEFAULT_MINIGAME_STATE,
    [GAME_STORY_BUILDER]: DEFAULT_MINIGAME_STATE,
  },
};

/** Coins available to spend right now, in any game's shop. */
export function spendableCoins(profile: PlayerProfile): number {
  return Math.max(0, profile.totalCoins - profile.spentCoins);
}

/** Typed accessor for one game's slice. */
export function gameState<K extends GameId>(
  profile: PlayerProfile,
  gameId: K,
): GameStates[K] {
  return profile.games[gameId];
}

/**
 * Multiple named child profiles sharing one household, with one active at a
 * time. Each child's data is still a plain `PlayerProfile` — this just adds
 * a selector on top, so nothing about progress tracking changes per child.
 */
export interface Household {
  activeChildId: string;
  /** Display order — object key order isn't guaranteed once ids are
   * generated at runtime, so it's tracked explicitly. */
  order: string[];
  children: Record<string, PlayerProfile>;
}

export type { AdventuresState, BasketballState, MiniGameState };
