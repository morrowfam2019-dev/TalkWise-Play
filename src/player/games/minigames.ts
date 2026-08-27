/**
 * GAME-003 … GAME-008 — the mini-games' slices of a child's saved data.
 *
 * ## Six namespaces, one shape
 *
 * §20 of the build plan is explicit: each mini-game owns its own namespace
 * and their progression is never mixed together. That is honoured exactly —
 * `profile.games["GAME-003"]` and `profile.games["GAME-005"]` are separate
 * objects, and no function here can write to a namespace its caller did not
 * name.
 *
 * What they *share* is the shape. Six copies of "best score, best combo,
 * accuracy, plays, today's session count" would be six places for the coin
 * cap to drift out of step, which §4 warns against in so many words. So one
 * `MiniGameState` type serves all six, exactly as `BasketballModeRecord`
 * serves three basketball modes — the isolation is in the *keying*, not in
 * having six different record types.
 *
 * ## How a record is keyed
 *
 * ```
 * records[`${packId}:${level}`] → MiniGameRecord
 * ```
 *
 * Pack and level, because those are the two choices a child makes before
 * every mini-game and the two things a personal best is only meaningful
 * within: a Bubble Blast best on Animal World at Beginner says nothing about
 * Colours & Shapes at Expert. The same reasoning as GAME-002's
 * `${soundId}:${difficulty}`.
 *
 * ## `collected` — the one game-defined field
 *
 * Some mini-games have a completion concept beyond a high score: Sound Match
 * finishes *sets*, Colour & Shape Hunt finds *objects*. Rather than a bespoke
 * key each, every game writes its own permanent ids into `collected`. The
 * framework never interprets them; only the game that wrote them does. That
 * keeps one sanitizer honest for every game without pretending the games are
 * the same.
 *
 * ## Backward and forward compatibility
 *
 * This whole file is additive. A profile saved before Launch Collection 01
 * has none of these six keys, `sanitizeMiniGameState(null)` supplies the
 * empty default, and nothing existing is read, moved or recomputed. A
 * rollback loses only mini-game records; GAME-001, GAME-002, the wallet and
 * the streak are untouched by design.
 */

import type {
  ContentPackId,
  MiniLearningLevel,
} from "@/content/minigames/types";

/** Best round recorded for one (pack, level) pairing of one mini-game. */
export interface MiniGameRecord {
  bestScore: number;
  /** Best whole-percent accuracy in a single session. */
  bestAccuracy: number;
  /** Longest correct-answer combo in a single session. */
  bestCombo: number;
  /** How many sessions of this pack/level have been finished. */
  plays: number;
  /** Whether the child has ever finished a full session of it. */
  completed: boolean;
}

export const EMPTY_MINI_RECORD: MiniGameRecord = {
  bestScore: 0,
  bestAccuracy: 0,
  bestCombo: 0,
  plays: 0,
  completed: false,
};

/**
 * Sessions finished *today*, which the coin formula's diminishing returns
 * are computed from. Resets whenever the stored date is not today — no
 * history is kept, because none is needed and a play log is more child data
 * than this feature justifies (§32). Identical reasoning to GAME-002's
 * `dailyPlays`.
 */
export interface MiniGameDailyPlays {
  date: string;
  sessions: number;
}

/** What a mini-game remembers between visits, so the setup screen can
 * re-offer the choice a child made last time instead of starting cold. */
export interface MiniGameSetupMemory {
  packId: ContentPackId;
  level: MiniLearningLevel;
}

export interface MiniGameState {
  /** Keyed `${packId}:${level}`. */
  records: Record<string, MiniGameRecord>;
  /** Permanent, game-defined completion ids. See the note above. */
  collected: string[];
  /** This mini-game's own achievement ids. Never shared between games. */
  achievements: string[];
  dailyPlays: MiniGameDailyPlays;
  lastSetup: MiniGameSetupMemory | null;
  /** Lifetime finished sessions of this mini-game, across every pack. */
  totalSessions: number;
}

export const DEFAULT_MINIGAME_STATE: MiniGameState = {
  records: {},
  collected: [],
  achievements: [],
  dailyPlays: { date: "", sessions: 0 },
  lastSetup: null,
  totalSessions: 0,
};

/** The key a (pack, level) record is stored under. */
export function miniRecordKey(
  packId: ContentPackId | string,
  level: MiniLearningLevel | string,
): string {
  return `${packId}:${level}`;
}

/** Local calendar date, matching the platform streak's definition of a day. */
export function localDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sanitizeRecord(raw: unknown): MiniGameRecord {
  if (typeof raw !== "object" || raw === null) return { ...EMPTY_MINI_RECORD };
  const record = raw as Partial<MiniGameRecord>;
  return {
    bestScore: Math.max(0, Math.floor(Number(record.bestScore) || 0)),
    bestAccuracy: Math.min(
      100,
      Math.max(0, Math.floor(Number(record.bestAccuracy) || 0)),
    ),
    bestCombo: Math.max(0, Math.floor(Number(record.bestCombo) || 0)),
    plays: Math.max(0, Math.floor(Number(record.plays) || 0)),
    completed: record.completed === true,
  };
}

/**
 * Rebuilds a trustworthy mini-game slice from whatever was in storage.
 *
 * Idempotent, which matters because the household is re-sanitised on every
 * read, on every write, and again server-side. `npm run verify:minigames`
 * proves it.
 */
export function sanitizeMiniGameState(raw: unknown): MiniGameState {
  if (typeof raw !== "object" || raw === null) {
    return {
      records: {},
      collected: [],
      achievements: [],
      dailyPlays: { date: "", sessions: 0 },
      lastSetup: null,
      totalSessions: 0,
    };
  }
  const value = raw as Partial<MiniGameState>;

  const records: Record<string, MiniGameRecord> = {};
  if (typeof value.records === "object" && value.records !== null) {
    for (const [key, entry] of Object.entries(value.records)) {
      records[key] = sanitizeRecord(entry);
    }
  }

  const collected = Array.isArray(value.collected)
    ? [
        ...new Set(
          value.collected.filter((id): id is string => typeof id === "string"),
        ),
      ]
    : [];

  const achievements = Array.isArray(value.achievements)
    ? [
        ...new Set(
          value.achievements.filter(
            (id): id is string => typeof id === "string",
          ),
        ),
      ]
    : [];

  const rawDaily =
    typeof value.dailyPlays === "object" && value.dailyPlays !== null
      ? (value.dailyPlays as Partial<MiniGameDailyPlays>)
      : {};

  const rawSetup =
    typeof value.lastSetup === "object" && value.lastSetup !== null
      ? (value.lastSetup as Partial<MiniGameSetupMemory>)
      : null;

  return {
    records,
    collected,
    achievements,
    dailyPlays: {
      date: typeof rawDaily.date === "string" ? rawDaily.date : "",
      sessions: Math.max(0, Math.floor(Number(rawDaily.sessions) || 0)),
    },
    // Deliberately not validated against the pack/level registries here: the
    // player layer must stay independent of the content layer, and a stale
    // memory is harmless — the setup screen falls back to its default when
    // it cannot resolve the pack.
    lastSetup:
      rawSetup &&
      typeof rawSetup.packId === "string" &&
      typeof rawSetup.level === "string"
        ? {
            packId: rawSetup.packId as ContentPackId,
            level: rawSetup.level as MiniLearningLevel,
          }
        : null,
    totalSessions: Math.max(0, Math.floor(Number(value.totalSessions) || 0)),
  };
}

export function getMiniRecordFrom(
  state: MiniGameState,
  packId: ContentPackId | string,
  level: MiniLearningLevel | string,
): MiniGameRecord {
  return state.records[miniRecordKey(packId, level)] ?? EMPTY_MINI_RECORD;
}

/** How many sessions of this mini-game have been finished today. */
export function getMiniPlaysToday(
  state: MiniGameState,
  now: Date = new Date(),
): number {
  if (state.dailyPlays.date !== localDateKey(now)) return 0;
  return state.dailyPlays.sessions;
}

/** What one finished mini-game session reports back to the save layer. */
export interface MiniGameSessionOutcome {
  packId: ContentPackId | string;
  level: MiniLearningLevel | string;
  score: number;
  /** Whole percent, 0–100. */
  accuracy: number;
  bestCombo: number;
  /** Whether the child played the session through rather than backing out. */
  completed: boolean;
  /**
   * Whether this session counts toward the daily reward cap. A session too
   * short or too empty to be practice does not — see `minigames/rewards.ts`
   * for the definition and why it exists.
   */
  countsTowardDaily: boolean;
  /** Permanent, game-defined ids this session completed. */
  collected?: string[];
}

/**
 * Folds a finished session into one mini-game's records.
 *
 * Pure and namespace-local: it is handed one game's state and returns one
 * game's state. It has no way to reach another mini-game's records, the
 * wallet, or the streak — those are the caller's job in `player/storage.ts`,
 * which is the same split GAME-001 and GAME-002 already use.
 */
export function mergeMiniGameSession(
  state: MiniGameState,
  outcome: MiniGameSessionOutcome,
  now: Date = new Date(),
): MiniGameState {
  const key = miniRecordKey(outcome.packId, outcome.level);
  const previous = state.records[key] ?? EMPTY_MINI_RECORD;

  const today = localDateKey(now);
  const dailyIsToday = state.dailyPlays.date === today;
  const sessions =
    (dailyIsToday ? state.dailyPlays.sessions : 0) +
    (outcome.countsTowardDaily ? 1 : 0);

  const collected = outcome.collected?.length
    ? [...new Set([...state.collected, ...outcome.collected])]
    : state.collected;

  return {
    ...state,
    records: {
      ...state.records,
      [key]: {
        bestScore: Math.max(previous.bestScore, Math.max(0, outcome.score)),
        bestAccuracy: Math.max(
          previous.bestAccuracy,
          Math.min(100, Math.max(0, Math.round(outcome.accuracy))),
        ),
        bestCombo: Math.max(previous.bestCombo, Math.max(0, outcome.bestCombo)),
        plays: previous.plays + 1,
        completed: previous.completed || outcome.completed,
      },
    },
    collected,
    dailyPlays: { date: today, sessions },
    lastSetup: {
      packId: outcome.packId as ContentPackId,
      level: outcome.level as MiniLearningLevel,
    },
    totalSessions: state.totalSessions + 1,
  };
}

/**
 * Whether a session's score is a new personal best for its (pack, level).
 *
 * Read *before* the session is merged, because afterwards the record is the
 * new score and the comparison would always be false. The coin formula pays
 * a personal-best bonus off this.
 */
export function isMiniPersonalBest(
  state: MiniGameState,
  packId: ContentPackId | string,
  level: MiniLearningLevel | string,
  score: number,
): boolean {
  return score > getMiniRecordFrom(state, packId, level).bestScore;
}
