/**
 * GAME-002 Speech Basketball — its slice of a child's saved data.
 *
 * Ballers, jerseys and high scores live only here. Buying a jersey must
 * never put anything into the Adventures inventory, and an Adventure
 * character must never become selectable on the court.
 */

import { DEFAULT_BALLER_ID, DEFAULT_JERSEY_ID } from "@/content/basketball/roster";

/** What a child is wearing on the court. */
export interface BasketballLoadout {
  ballerId: string;
  jerseyId: string | null;
}

/** Best round recorded for one target sound. */
export interface BasketballHighScore {
  /** Best basketball score (points from made shots). */
  bestScore: number;
  /** Most baskets made in a single round. */
  bestBaskets: number;
  /** Longest make-streak in a single round. */
  bestStreak: number;
}

export interface BasketballState {
  /** Basketball shop item ids this child owns. Basketball-only. */
  owned: string[];
  loadout: BasketballLoadout;
  /** Per-sound records, keyed by speech sound id (e.g. "m"). */
  highScores: Record<string, BasketballHighScore>;
}

export const EMPTY_HIGH_SCORE: BasketballHighScore = {
  bestScore: 0,
  bestBaskets: 0,
  bestStreak: 0,
};

export const DEFAULT_BASKETBALL_STATE: BasketballState = {
  owned: [DEFAULT_BALLER_ID, DEFAULT_JERSEY_ID],
  loadout: { ballerId: DEFAULT_BALLER_ID, jerseyId: DEFAULT_JERSEY_ID },
  highScores: {},
};

export function sanitizeBasketballState(raw: unknown): BasketballState {
  if (typeof raw !== "object" || raw === null) {
    return {
      owned: [...DEFAULT_BASKETBALL_STATE.owned],
      loadout: { ...DEFAULT_BASKETBALL_STATE.loadout },
      highScores: {},
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
  };
}

export function getHighScoreFrom(
  state: BasketballState,
  soundId: string,
): BasketballHighScore {
  return state.highScores[soundId] ?? EMPTY_HIGH_SCORE;
}

/** Folds a finished round into this sound's records, keeping personal bests. */
export function mergeBasketballRound(
  state: BasketballState,
  soundId: string,
  round: { basketballScore: number; basketsMade: number; bestStreak: number },
): BasketballState {
  const previous = getHighScoreFrom(state, soundId);
  return {
    ...state,
    highScores: {
      ...state.highScores,
      [soundId]: {
        bestScore: Math.max(previous.bestScore, round.basketballScore),
        bestBaskets: Math.max(previous.bestBaskets, round.basketsMade),
        bestStreak: Math.max(previous.bestStreak, round.bestStreak),
      },
    },
  };
}
