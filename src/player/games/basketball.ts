/**
 * GAME-002 Speech Basketball — its slice of a child's saved data.
 *
 * Ballers, jerseys and records live only here. Buying a jersey must never put
 * anything into the Adventures inventory, and an Adventure character must
 * never become selectable on the court.
 *
 * ## How the multi-mode expansion extended this without breaking anyone
 *
 * `highScores` is the original, keyed by sound id alone — no mode, no
 * difficulty, because when it was written there was only one of each. Every
 * profile in production has it. So it is **left exactly as it was** and
 * Shootout keeps writing to it, while everything the expansion needs lives in
 * a parallel `modes` tree keyed by mode + sound + difficulty.
 *
 * That is the same additive shape the v1→v2 household migration used: a
 * profile saved before this change has no `modes` key, `sanitizeBasketballState`
 * fills in the empty default, and nothing is lost, duplicated or recomputed.
 * A rollback likewise loses only the new records, never the old ones.
 */

import { DEFAULT_BALLER_ID, DEFAULT_JERSEY_ID } from "@/content/basketball/roster";

/** What a child is wearing on the court. */
export interface BasketballLoadout {
  ballerId: string;
  jerseyId: string | null;
}

/** Best round recorded for one target sound. The original Shootout shape. */
export interface BasketballHighScore {
  /** Best basketball score (points from made shots). */
  bestScore: number;
  /** Most baskets made in a single round. */
  bestBaskets: number;
  /** Longest make-streak in a single round. */
  bestStreak: number;
}

/** Permanent per-mode save keys. Mirror `modes/registry.ts` mode ids. */
export type BasketballModeKey = "shootout" | "timeAttack" | "clutch";

export const BASKETBALL_MODE_KEYS: BasketballModeKey[] = [
  "shootout",
  "timeAttack",
  "clutch",
];

/**
 * One mode's personal best for one (sound, difficulty) pairing. Deliberately
 * a superset of `BasketballHighScore` — Time Attack needs accuracy and shot
 * counts that a fixed 10-shot round never had to record.
 */
export interface BasketballModeRecord {
  bestScore: number;
  bestBaskets: number;
  bestStreak: number;
  /** Best whole-percent accuracy in a single round. */
  bestAccuracy: number;
  /** How many rounds of this mode/sound/difficulty have been finished. */
  plays: number;
}

export const EMPTY_MODE_RECORD: BasketballModeRecord = {
  bestScore: 0,
  bestBaskets: 0,
  bestStreak: 0,
  bestAccuracy: 0,
  plays: 0,
};

/** Records for every mode, each keyed by `${soundId}:${difficulty}`. */
export type BasketballModesState = Record<
  BasketballModeKey,
  Record<string, BasketballModeRecord>
>;

/** How much practice a child has done at each difficulty, per sound. */
export interface BasketballDifficultyProgress {
  plays: number;
  /** ISO date (YYYY-MM-DD, local) of the most recent finished round. */
  lastPlayedDate: string | null;
}

/**
 * Rounds finished per mode *today*, which is what the Time Attack coin
 * formula's diminishing returns are computed from. Resets whenever the stored
 * date is not today — no history is kept, because none is needed and a play
 * log is more child data than this feature justifies.
 */
export interface BasketballDailyPlays {
  date: string;
  counts: Partial<Record<BasketballModeKey, number>>;
}

export interface BasketballState {
  /** Basketball shop item ids this child owns. Basketball-only. */
  owned: string[];
  loadout: BasketballLoadout;
  /**
   * Per-sound Shootout records, keyed by speech sound id (e.g. "m").
   * ORIGINAL SHAPE — do not re-key. See the note at the top of this file.
   */
  highScores: Record<string, BasketballHighScore>;
  /** Per-mode records, keyed by `${soundId}:${difficulty}`. Added by the expansion. */
  modes: BasketballModesState;
  /** Practice counts keyed by `${soundId}:${difficulty}`. Added by the expansion. */
  difficultyProgress: Record<string, BasketballDifficultyProgress>;
  /** Basketball-only achievement ids. Added by the expansion. */
  achievements: string[];
  /** Today's per-mode round counts, for coin diminishing returns. */
  dailyPlays: BasketballDailyPlays;
}

export const EMPTY_HIGH_SCORE: BasketballHighScore = {
  bestScore: 0,
  bestBaskets: 0,
  bestStreak: 0,
};

function emptyModes(): BasketballModesState {
  return { shootout: {}, timeAttack: {}, clutch: {} };
}

export const DEFAULT_BASKETBALL_STATE: BasketballState = {
  owned: [DEFAULT_BALLER_ID, DEFAULT_JERSEY_ID],
  loadout: { ballerId: DEFAULT_BALLER_ID, jerseyId: DEFAULT_JERSEY_ID },
  highScores: {},
  modes: emptyModes(),
  difficultyProgress: {},
  achievements: [],
  dailyPlays: { date: "", counts: {} },
};

/** The key a mode's records and a difficulty's progress are stored under. */
export function basketballRecordKey(
  soundId: string,
  difficulty: string,
): string {
  return `${soundId}:${difficulty}`;
}

/** Local calendar date, matching the platform streak's definition of a day. */
export function localDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sanitizeModeRecord(raw: unknown): BasketballModeRecord {
  if (typeof raw !== "object" || raw === null) return { ...EMPTY_MODE_RECORD };
  const record = raw as Partial<BasketballModeRecord>;
  return {
    bestScore: Math.max(0, Number(record.bestScore) || 0),
    bestBaskets: Math.max(0, Number(record.bestBaskets) || 0),
    bestStreak: Math.max(0, Number(record.bestStreak) || 0),
    bestAccuracy: Math.min(100, Math.max(0, Number(record.bestAccuracy) || 0)),
    plays: Math.max(0, Number(record.plays) || 0),
  };
}

export function sanitizeBasketballState(raw: unknown): BasketballState {
  if (typeof raw !== "object" || raw === null) {
    return {
      ...DEFAULT_BASKETBALL_STATE,
      owned: [...DEFAULT_BASKETBALL_STATE.owned],
      loadout: { ...DEFAULT_BASKETBALL_STATE.loadout },
      highScores: {},
      modes: emptyModes(),
      difficultyProgress: {},
      achievements: [],
      dailyPlays: { date: "", counts: {} },
    };
  }
  const value = raw as Partial<BasketballState>;

  const highScores: Record<string, BasketballHighScore> = {};
  if (typeof value.highScores === "object" && value.highScores !== null) {
    for (const [id, entry] of Object.entries(value.highScores)) {
      if (typeof entry !== "object" || entry === null) continue;
      const record = entry as Partial<BasketballHighScore>;
      highScores[id] = {
        bestScore: Number(record.bestScore) || 0,
        bestBaskets: Number(record.bestBaskets) || 0,
        bestStreak: Number(record.bestStreak) || 0,
      };
    }
  }

  // Absent on every profile saved before the expansion — the empty default is
  // the migration, and it is a no-op rather than a rebuild from `highScores`.
  // Deriving Shootout mode records from the legacy scores would invent a
  // difficulty the child never actually played at.
  const modes = emptyModes();
  const rawModes =
    typeof value.modes === "object" && value.modes !== null
      ? (value.modes as Record<string, unknown>)
      : {};
  for (const modeKey of BASKETBALL_MODE_KEYS) {
    const bucket = rawModes[modeKey];
    if (typeof bucket !== "object" || bucket === null) continue;
    for (const [key, entry] of Object.entries(bucket)) {
      modes[modeKey][key] = sanitizeModeRecord(entry);
    }
  }

  const difficultyProgress: Record<string, BasketballDifficultyProgress> = {};
  if (
    typeof value.difficultyProgress === "object" &&
    value.difficultyProgress !== null
  ) {
    for (const [key, entry] of Object.entries(value.difficultyProgress)) {
      if (typeof entry !== "object" || entry === null) continue;
      const record = entry as Partial<BasketballDifficultyProgress>;
      difficultyProgress[key] = {
        plays: Math.max(0, Number(record.plays) || 0),
        lastPlayedDate:
          typeof record.lastPlayedDate === "string"
            ? record.lastPlayedDate
            : null,
      };
    }
  }

  const achievements = Array.isArray(value.achievements)
    ? value.achievements.filter((id): id is string => typeof id === "string")
    : [];

  const rawDaily =
    typeof value.dailyPlays === "object" && value.dailyPlays !== null
      ? (value.dailyPlays as Partial<BasketballDailyPlays>)
      : {};
  const counts: Partial<Record<BasketballModeKey, number>> = {};
  if (typeof rawDaily.counts === "object" && rawDaily.counts !== null) {
    for (const modeKey of BASKETBALL_MODE_KEYS) {
      const count = Number(
        (rawDaily.counts as Record<string, unknown>)[modeKey],
      );
      if (Number.isFinite(count) && count > 0) counts[modeKey] = Math.floor(count);
    }
  }

  const owned = Array.isArray(value.owned)
    ? value.owned.filter((id): id is string => typeof id === "string")
    : [];
  // The starter baller and home jersey are always owned — a child can never
  // end up with nobody to play as.
  if (!owned.includes(DEFAULT_BALLER_ID)) owned.push(DEFAULT_BALLER_ID);
  if (!owned.includes(DEFAULT_JERSEY_ID)) owned.push(DEFAULT_JERSEY_ID);

  const rawLoadout =
    typeof value.loadout === "object" && value.loadout !== null
      ? (value.loadout as Partial<BasketballLoadout>)
      : {};
  const equipped = (id: unknown): string | null =>
    typeof id === "string" && owned.includes(id) ? id : null;

  return {
    owned,
    loadout: {
      ballerId: equipped(rawLoadout.ballerId) ?? DEFAULT_BALLER_ID,
      jerseyId: equipped(rawLoadout.jerseyId) ?? DEFAULT_JERSEY_ID,
    },
    highScores,
    modes,
    difficultyProgress,
    achievements,
    dailyPlays: {
      date: typeof rawDaily.date === "string" ? rawDaily.date : "",
      counts,
    },
  };
}

export function getHighScoreFrom(
  state: BasketballState,
  soundId: string,
): BasketballHighScore {
  return state.highScores[soundId] ?? EMPTY_HIGH_SCORE;
}

/** One mode's record for a (sound, difficulty), or an empty one. */
export function getModeRecord(
  state: BasketballState,
  mode: BasketballModeKey,
  soundId: string,
  difficulty: string,
): BasketballModeRecord {
  return (
    state.modes[mode]?.[basketballRecordKey(soundId, difficulty)] ??
    EMPTY_MODE_RECORD
  );
}

/** How many rounds of `mode` have been finished today. */
export function getPlaysToday(
  state: BasketballState,
  mode: BasketballModeKey,
  now: Date = new Date(),
): number {
  if (state.dailyPlays.date !== localDateKey(now)) return 0;
  return state.dailyPlays.counts[mode] ?? 0;
}

/** What one finished round of any mode reports back. */
export interface BasketballRoundOutcome {
  mode: BasketballModeKey;
  soundId: string;
  difficulty: string;
  /** Points scored this round. */
  basketballScore: number;
  basketsMade: number;
  shotsTaken: number;
  bestStreak: number;
}

/**
 * Folds a finished round into this child's Basketball records.
 *
 * Writes in two places on purpose: the legacy `highScores` (Shootout only, so
 * existing profiles and the existing home screen keep reading the number they
 * always read) and the new per-mode tree (every mode, keyed by difficulty).
 */
export function mergeBasketballRound(
  state: BasketballState,
  outcome: BasketballRoundOutcome,
  now: Date = new Date(),
): BasketballState {
  const {
    mode,
    soundId,
    difficulty,
    basketballScore,
    basketsMade,
    shotsTaken,
    bestStreak,
  } = outcome;
  const key = basketballRecordKey(soundId, difficulty);
  const accuracy =
    shotsTaken > 0 ? Math.round((basketsMade / shotsTaken) * 100) : 0;

  // Legacy Shootout records: unchanged behaviour, unchanged shape.
  const highScores =
    mode === "shootout"
      ? {
          ...state.highScores,
          [soundId]: {
            bestScore: Math.max(
              getHighScoreFrom(state, soundId).bestScore,
              basketballScore,
            ),
            bestBaskets: Math.max(
              getHighScoreFrom(state, soundId).bestBaskets,
              basketsMade,
            ),
            bestStreak: Math.max(
              getHighScoreFrom(state, soundId).bestStreak,
              bestStreak,
            ),
          },
        }
      : state.highScores;

  const previousRecord = getModeRecord(state, mode, soundId, difficulty);
  const previousProgress = state.difficultyProgress[key] ?? {
    plays: 0,
    lastPlayedDate: null,
  };

  const today = localDateKey(now);
  const dailyIsToday = state.dailyPlays.date === today;
  const dailyCounts = dailyIsToday ? { ...state.dailyPlays.counts } : {};
  dailyCounts[mode] = (dailyCounts[mode] ?? 0) + 1;

  return {
    ...state,
    highScores,
    modes: {
      ...state.modes,
      [mode]: {
        ...state.modes[mode],
        [key]: {
          bestScore: Math.max(previousRecord.bestScore, basketballScore),
          bestBaskets: Math.max(previousRecord.bestBaskets, basketsMade),
          bestStreak: Math.max(previousRecord.bestStreak, bestStreak),
          bestAccuracy: Math.max(previousRecord.bestAccuracy, accuracy),
          plays: previousRecord.plays + 1,
        },
      },
    },
    difficultyProgress: {
      ...state.difficultyProgress,
      [key]: {
        plays: previousProgress.plays + 1,
        lastPlayedDate: today,
      },
    },
    dailyPlays: { date: today, counts: dailyCounts },
  };
}
