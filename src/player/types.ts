/**
 * Player data model. Kept independent of both the game engine and the speech
 * content so it can later be backed by a server without touching gameplay.
 */

/** Saved result for a single level. */
export interface LevelProgress {
  /** Highest number of checkpoints completed in any single run. */
  bestCheckpoints: number;
  /** Highest coin total earned in any single run. */
  bestCoins: number;
  /** True once the level has been finished at least once. */
  completed: boolean;
}

/** What a player is currently wearing and standing in. */
export interface Loadout {
  characterId: string;
  auraId: string | null;
  boostId: string | null;
  /** Cosmetic hat, layered on top of whichever character is equipped. */
  hatId: string | null;
}

/** Everything persisted about a player. */
export interface PlayerProfile {
  /** Kid-facing display name. Empty until they choose one. */
  name: string;
  /** Lifetime coin total across all runs. Never decreases — it's the record
   * of everything earned, and achievements are measured against it. */
  totalCoins: number;
  /** Lifetime coins spent in the shop. Spendable balance is the difference,
   * so buying something never erases the achievement of having earned it. */
  spentCoins: number;
  /** Shop item ids the player owns. */
  owned: string[];
  /** What they have equipped right now. */
  loadout: Loadout;
  /** Per-level records, keyed by level id. */
  levels: Record<string, LevelProgress>;
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
   */
  micEnabled: boolean;
  /**
   * Easy-mode movement and listening assists: more forgiving jump timing and
   * a longer window to speak before an attempt times out. Never touches
   * checkpoint count or which words are asked — those stay level content,
   * not something a difficulty setting can shorten.
   */
  assistMode: boolean;
}

export const EMPTY_LEVEL_PROGRESS: LevelProgress = {
  bestCheckpoints: 0,
  bestCoins: 0,
  completed: false,
};

export const DEFAULT_PROFILE: PlayerProfile = {
  name: "",
  totalCoins: 0,
  spentCoins: 0,
  owned: ["milo"],
  loadout: { characterId: "milo", auraId: null, boostId: null, hatId: null },
  levels: {},
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedDate: null,
  micEnabled: true,
  assistMode: false,
};

/** Coins available to spend right now. */
export function spendableCoins(profile: PlayerProfile): number {
  return Math.max(0, profile.totalCoins - profile.spentCoins);
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
