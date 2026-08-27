/**
 * GAME-001 Speech Adventures — its slice of a child's saved data.
 *
 * Everything a child owns, wears, or has completed *in Adventures* lives
 * here and nowhere else. Basketball cannot read or write any of it, and an
 * Adventure character can never turn up on a basketball court.
 */

import { DEFAULT_CHARACTER_ID } from "@/content/adventures/shop";

/**
 * ## The three tiers, in saved data
 *
 * ```
 * games["GAME-001"]
 *   ├── owned, loadout        shop inventory — shared by all three tiers
 *   ├── levels                INTERMEDIATE — the word adventures
 *   ├── beginner              BEGINNER — Sound Explorer maps and stations
 *   └── expert                EXPERT — sentence quests
 * ```
 *
 * `levels` is the Intermediate tier's record and **was deliberately not
 * renamed**. Every production profile already has it, the word adventures
 * already write it, and moving live saved data to a new key buys nothing
 * but a migration that can strand somebody. The tier a record belongs to is
 * expressed in the types and accessors, not in a key rename. `sanitize`
 * below does still accept an `intermediate.levels` shape and merges it, so
 * a save written by any future build that does move the key is read
 * correctly rather than silently dropped.
 *
 * `beginner` and `expert` are new sibling keys. A profile saved before this
 * upgrade simply has neither, gets the empty defaults, and loses nothing —
 * the same additive pattern as the v1→v2 household migration. Rolling back
 * is equally safe: an older build ignores the two keys it does not know,
 * and `levels` is exactly where it always was.
 */

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

/**
 * BEGINNER — one sound station's record, keyed by sound id inside its map.
 *
 * Three counters, no score. `attempts` counts every turn a child took at the
 * station, `completions` counts the turns that finished — whether the
 * microphone heard them or the child tapped the button. There is no accuracy
 * figure and no mastery flag anywhere in this record, deliberately: this is
 * educational practice, not assessment.
 */
export interface StationProgress {
  /** The child has walked up to this station at least once. */
  visited: boolean;
  /** Turns taken. */
  attempts: number;
  /** Turns finished. Lights the station when it reaches its repetitions. */
  completions: number;
}

/** BEGINNER — one explorer map's record. */
export interface BeginnerMapProgress {
  /** Station records, keyed by sound id. */
  stations: Record<string, StationProgress>;
  /** True once the map celebration has been shown at least once. */
  celebrated: boolean;
}

export interface BeginnerState {
  /** Map records, keyed by map id. */
  maps: Record<string, BeginnerMapProgress>;
}

/** EXPERT — one sentence quest's record. */
export interface QuestProgress {
  /** Most scenes finished in a single run through the quest. */
  bestScenes: number;
  /** Highest coin total from a single run. */
  bestCoins: number;
  /** True once every scene has been finished in one run. */
  completed: boolean;
}

export interface ExpertState {
  /** Quest records, keyed by quest id. */
  quests: Record<string, QuestProgress>;
}

export interface AdventuresState {
  /** Adventure shop item ids this child owns. Adventure-only. */
  owned: string[];
  loadout: AdventuresLoadout;
  /**
   * INTERMEDIATE — per-level records, keyed by level id. The original key,
   * unchanged; see the tier note at the top of this file.
   */
  levels: Record<string, LevelProgress>;
  /** BEGINNER — Sound Explorer progress. */
  beginner: BeginnerState;
  /** EXPERT — Sentence Adventure progress. */
  expert: ExpertState;
}

export const EMPTY_LEVEL_PROGRESS: LevelProgress = {
  bestCheckpoints: 0,
  bestCoins: 0,
  completed: false,
};

export const EMPTY_STATION_PROGRESS: StationProgress = {
  visited: false,
  attempts: 0,
  completions: 0,
};

export const EMPTY_MAP_PROGRESS: BeginnerMapProgress = {
  stations: {},
  celebrated: false,
};

export const EMPTY_QUEST_PROGRESS: QuestProgress = {
  bestScenes: 0,
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
  beginner: { maps: {} },
  expert: { quests: {} },
};

/** Folds one raw `{ levels }` map into `into`, keeping the better record of
 * the two wherever both sources name the same level. */
function mergeLevelRecords(
  into: Record<string, LevelProgress>,
  raw: unknown,
): void {
  if (typeof raw !== "object" || raw === null) return;
  for (const [id, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Partial<LevelProgress>;
    const previous = into[id] ?? EMPTY_LEVEL_PROGRESS;
    into[id] = {
      bestCheckpoints: Math.max(
        previous.bestCheckpoints,
        Number(record.bestCheckpoints) || 0,
      ),
      bestCoins: Math.max(previous.bestCoins, Number(record.bestCoins) || 0),
      completed: previous.completed || Boolean(record.completed),
    };
  }
}

function sanitizeBeginnerState(raw: unknown): BeginnerState {
  const maps: Record<string, BeginnerMapProgress> = {};
  if (typeof raw === "object" && raw !== null) {
    const value = raw as Partial<BeginnerState>;
    if (typeof value.maps === "object" && value.maps !== null) {
      for (const [mapId, entry] of Object.entries(value.maps)) {
        if (typeof entry !== "object" || entry === null) continue;
        const map = entry as Partial<BeginnerMapProgress>;
        const stations: Record<string, StationProgress> = {};
        if (typeof map.stations === "object" && map.stations !== null) {
          for (const [soundId, record] of Object.entries(map.stations)) {
            if (typeof record !== "object" || record === null) continue;
            const station = record as Partial<StationProgress>;
            const attempts = Math.max(0, Number(station.attempts) || 0);
            const completions = Math.max(0, Number(station.completions) || 0);
            stations[soundId] = {
              // A completed turn is always an attempt too, so a hand-edited
              // save can never claim more finishes than tries.
              visited: Boolean(station.visited) || attempts > 0,
              attempts: Math.max(attempts, completions),
              completions,
            };
          }
        }
        maps[mapId] = { stations, celebrated: Boolean(map.celebrated) };
      }
    }
  }
  return { maps };
}

function sanitizeExpertState(raw: unknown): ExpertState {
  const quests: Record<string, QuestProgress> = {};
  if (typeof raw === "object" && raw !== null) {
    const value = raw as Partial<ExpertState>;
    if (typeof value.quests === "object" && value.quests !== null) {
      for (const [questId, entry] of Object.entries(value.quests)) {
        if (typeof entry !== "object" || entry === null) continue;
        const record = entry as Partial<QuestProgress>;
        quests[questId] = {
          bestScenes: Math.max(0, Number(record.bestScenes) || 0),
          bestCoins: Math.max(0, Number(record.bestCoins) || 0),
          completed: Boolean(record.completed),
        };
      }
    }
  }
  return { quests };
}

/**
 * Rebuilds a trustworthy Adventures state from whatever was in storage.
 *
 * Accepts every shape GAME-001 has ever written:
 *
 * - the pre-namespace flat `PlayerProfile` (v1), whose `levels` were
 *   Adventures data because Adventures was the only game — see `storage.ts`;
 * - the namespaced pre-tier shape, which has `levels` but no `beginner` or
 *   `expert`, and gets the empty defaults for both;
 * - the current shape;
 * - and, defensively, an `intermediate.levels` shape, merged into `levels`
 *   record-by-record keeping the better of the two.
 *
 * **Idempotent.** Running it over its own output changes nothing: the merge
 * keeps maxima, the flags OR together, and the tier defaults are already
 * present the second time round. That matters because the household is
 * re-sanitised on every read, on every write, and again server-side.
 */
export function sanitizeAdventuresState(raw: unknown): AdventuresState {
  if (typeof raw !== "object" || raw === null) {
    return structuredCloneState(DEFAULT_ADVENTURES_STATE);
  }
  const value = raw as Partial<AdventuresState> & {
    intermediate?: { levels?: unknown };
  };

  const levels: Record<string, LevelProgress> = {};
  mergeLevelRecords(levels, value.levels);
  mergeLevelRecords(levels, value.intermediate?.levels);

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
    beginner: sanitizeBeginnerState(value.beginner),
    expert: sanitizeExpertState(value.expert),
  };
}

function structuredCloneState(state: AdventuresState): AdventuresState {
  return {
    owned: [...state.owned],
    loadout: { ...state.loadout },
    levels: {},
    beginner: { maps: {} },
    expert: { quests: {} },
  };
}

// ---------------------------------------------------------------------------
// INTERMEDIATE — word adventures
// ---------------------------------------------------------------------------

export function getLevelProgressFrom(
  state: AdventuresState,
  levelId: string,
): LevelProgress {
  return state.levels[levelId] ?? EMPTY_LEVEL_PROGRESS;
}

// ---------------------------------------------------------------------------
// BEGINNER — Sound Explorer
// ---------------------------------------------------------------------------

export function getMapProgressFrom(
  state: AdventuresState,
  mapId: string,
): BeginnerMapProgress {
  return state.beginner.maps[mapId] ?? EMPTY_MAP_PROGRESS;
}

export function getStationProgressFrom(
  state: AdventuresState,
  mapId: string,
  soundId: string,
): StationProgress {
  return (
    getMapProgressFrom(state, mapId).stations[soundId] ?? EMPTY_STATION_PROGRESS
  );
}

/** A whole map's finished turns, for the map card and the parent view. */
export function countMapCompletions(map: BeginnerMapProgress): number {
  return Object.values(map.stations).reduce(
    (total, station) => total + station.completions,
    0,
  );
}

/** How many of a map's stations the child has walked up to. */
export function countMapVisited(map: BeginnerMapProgress): number {
  return Object.values(map.stations).filter((station) => station.visited)
    .length;
}

/**
 * Folds one visit to a sound station into a map record.
 *
 * `attempts` always grows; `completions` grows only when the turn finished.
 * Both are monotonic and capped by nothing — a child who loves the swing
 * station and says /m/ forty times has said /m/ forty times, and the record
 * says so.
 */
export function mergeStationTurn(
  state: AdventuresState,
  mapId: string,
  soundId: string,
  turn: { completed: boolean },
): AdventuresState {
  const map = getMapProgressFrom(state, mapId);
  const station = map.stations[soundId] ?? EMPTY_STATION_PROGRESS;
  return {
    ...state,
    beginner: {
      ...state.beginner,
      maps: {
        ...state.beginner.maps,
        [mapId]: {
          ...map,
          stations: {
            ...map.stations,
            [soundId]: {
              visited: true,
              attempts: station.attempts + 1,
              completions: station.completions + (turn.completed ? 1 : 0),
            },
          },
        },
      },
    },
  };
}

/** Records that a child reached this map's celebration. Idempotent. */
export function markMapCelebrated(
  state: AdventuresState,
  mapId: string,
): AdventuresState {
  const map = getMapProgressFrom(state, mapId);
  if (map.celebrated) return state;
  return {
    ...state,
    beginner: {
      ...state.beginner,
      maps: { ...state.beginner.maps, [mapId]: { ...map, celebrated: true } },
    },
  };
}

// ---------------------------------------------------------------------------
// EXPERT — sentence quests
// ---------------------------------------------------------------------------

export function getQuestProgressFrom(
  state: AdventuresState,
  questId: string,
): QuestProgress {
  return state.expert.quests[questId] ?? EMPTY_QUEST_PROGRESS;
}

/** Folds a finished Expert run into the quest record, keeping bests. */
export function mergeQuestRun(
  state: AdventuresState,
  questId: string,
  run: { scenes: number; coins: number; completed: boolean },
): AdventuresState {
  const previous = getQuestProgressFrom(state, questId);
  return {
    ...state,
    expert: {
      ...state.expert,
      quests: {
        ...state.expert.quests,
        [questId]: {
          bestScenes: Math.max(previous.bestScenes, run.scenes),
          bestCoins: Math.max(previous.bestCoins, run.coins),
          completed: previous.completed || run.completed,
        },
      },
    },
  };
}
