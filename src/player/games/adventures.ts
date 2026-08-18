/**
 * GAME-001 Speech Adventures — its slice of a child's saved data.
 *
 * Everything a child owns, wears, or has completed *in Adventures* lives
 * here and nowhere else. Basketball cannot read or write any of it, and an
 * Adventure character can never turn up on a basketball court.
 */

import { DEFAULT_CHARACTER_ID } from "@/content/adventures/shop";

/** Saved result for a single adventure level. */
export interface LevelProgress {
  /** Highest number of checkpoints completed in any single run. */
  bestCheckpoints: number;
  /** Highest coin total earned in any single run. */
  bestCoins: number;
  /** True once the level has been finished at least once. */
  completed: boolean;
}

/** What a child is wearing in Adventures. */
export interface AdventuresLoadout {
  characterId: string;
  auraId: string | null;
  boostId: string | null;
  /** Cosmetic hat, layered on top of whichever character is equipped. */
  hatId: string | null;
}

export interface AdventuresState {
  /** Adventure shop item ids this child owns. Adventure-only. */
  owned: string[];
  loadout: AdventuresLoadout;
  /** Per-level records, keyed by level id. */
  levels: Record<string, LevelProgress>;
}

export const EMPTY_LEVEL_PROGRESS: LevelProgress = {
  bestCheckpoints: 0,
  bestCoins: 0,
  completed: false,
};

export const DEFAULT_ADVENTURES_STATE: AdventuresState = {
  owned: [DEFAULT_CHARACTER_ID],
  loadout: {
    characterId: DEFAULT_CHARACTER_ID,
    auraId: null,
    boostId: null,
    hatId: null,
  },
  levels: {},
};

/**
 * Rebuilds a trustworthy Adventures state from whatever was in storage.
 * Also accepts the pre-namespace (flat `PlayerProfile`) shape, which is how
 * an existing player's progress migrates in — see `storage.ts`.
 */
export function sanitizeAdventuresState(raw: unknown): AdventuresState {
  if (typeof raw !== "object" || raw === null) {
    return structuredCloneState(DEFAULT_ADVENTURES_STATE);
  }
  const value = raw as Partial<AdventuresState>;

  const levels: Record<string, LevelProgress> = {};
  if (typeof value.levels === "object" && value.levels !== null) {
    for (const [id, entry] of Object.entries(value.levels)) {
      if (typeof entry !== "object" || entry === null) continue;
      const record = entry as Partial<LevelProgress>;
      levels[id] = {
        bestCheckpoints: Number(record.bestCheckpoints) || 0,
        bestCoins: Number(record.bestCoins) || 0,
        completed: Boolean(record.completed),
      };
    }
  }

  const owned = Array.isArray(value.owned)
    ? value.owned.filter((id): id is string => typeof id === "string")
    : [];
  if (!owned.includes(DEFAULT_CHARACTER_ID)) owned.push(DEFAULT_CHARACTER_ID);

  const rawLoadout =
    typeof value.loadout === "object" && value.loadout !== null
      ? (value.loadout as Partial<AdventuresLoadout>)
      : {};
  // Only ever equip something the child actually owns — a hand-edited save
  // or a retired item can't leave them wearing something that isn't theirs.
  const equipped = (id: unknown): string | null =>
    typeof id === "string" && owned.includes(id) ? id : null;

  return {
    owned,
    loadout: {
      characterId: equipped(rawLoadout.characterId) ?? DEFAULT_CHARACTER_ID,
      auraId: equipped(rawLoadout.auraId),
      boostId: equipped(rawLoadout.boostId),
      hatId: equipped(rawLoadout.hatId),
    },
    levels,
  };
}

function structuredCloneState(state: AdventuresState): AdventuresState {
  return {
    owned: [...state.owned],
    loadout: { ...state.loadout },
    levels: {},
  };
}

export function getLevelProgressFrom(
  state: AdventuresState,
  levelId: string,
): LevelProgress {
  return state.levels[levelId] ?? EMPTY_LEVEL_PROGRESS;
}
