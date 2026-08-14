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

/** Everything persisted about a player. */
export interface PlayerProfile {
  /** Kid-facing display name. Empty until they choose one. */
  name: string;
  /** Lifetime coin total across all runs. */
  totalCoins: number;
  /** Per-level records, keyed by level id. */
  levels: Record<string, LevelProgress>;
}

export const EMPTY_LEVEL_PROGRESS: LevelProgress = {
  bestCheckpoints: 0,
  bestCoins: 0,
  completed: false,
};

export const DEFAULT_PROFILE: PlayerProfile = {
  name: "",
  totalCoins: 0,
  levels: {},
};
