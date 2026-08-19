/**
 * Speech Basketball's round engine — pure data and functions, no rendering,
 * no React. A round is: say the word, then take a skill-based shot. Speech
 * unlocks the shot; a timing meter decides whether the shot goes in. A
 * missed pronunciation never fails the round — only the third layer
 * (basketball itself) has a fail state, and even that is forgiving.
 */

import type { SpeechTarget } from "@/content/speech/engine";
import {
  getCourtSpot,
  MAKE_BONUS_COINS,
  PERFECT_TIMING_BONUS_COINS,
  ROUND_SPOT_SEQUENCE,
  SPEECH_COINS,
  type CourtSpot,
} from "@/content/basketball/types";

/** How close the shot-meter tap landed to the target zone. */
export type TimingTier = "perfect" | "good" | "miss";

/** One shot's plan: which spot, which word — built before the round starts
 * so the whole sequence is knowable up front (useful for tests and for the
 * HUD's "shot 4 of 10" progress). */
export interface ShotPlan {
  index: number;
  spot: CourtSpot;
  /** What the child has to say before this shot unlocks. */
  target: SpeechTarget;
  /** Convenience mirror of `target.text`, used by results and records. */
  word: string;
  prompt: string;
  praise: string;
}

export interface ShotResult {
  index: number;
  spot: CourtSpot;
  word: string;
  timing: TimingTier;
  made: boolean;
  pointsEarned: number;
  coinsEarned: number;
}

export interface RoundSummary {
  wordsCompleted: number;
  basketsMade: number;
  basketballScore: number;
  coinsEarned: number;
  bestStreak: number;
}

/**
 * Builds the 10-shot plan: each court spot in `ROUND_SPOT_SEQUENCE`, paired
 * with a speech target supplied by the shared content engine.
 *
 * Basketball asks the content engine for exactly `SHOTS_PER_ROUND` targets at
 * the chosen difficulty and pairs them positionally, so the cycling rule
 * (5 words over 10 shots means each is asked twice) now lives in the content
 * layer where every game benefits from it, rather than here.
 */
export function buildRoundPlan(targets: SpeechTarget[]): ShotPlan[] {
  if (targets.length === 0) return [];
  return ROUND_SPOT_SEQUENCE.map((spotId, index) => {
    const target = targets[index % targets.length];
    return {
      index,
      spot: getCourtSpot(spotId),
      target,
      word: target.text,
      prompt: target.prompt,
      praise: target.praise,
    };
  });
}

/** Make-chance per timing tier. Landing in the green zone is a guaranteed
 * make — that's the whole point of nailing the timing. Yellow is a coin
 * flip. Missing the bar entirely is a guaranteed miss. */
const MAKE_CHANCE: Record<TimingTier, number> = {
  perfect: 1,
  good: 0.5,
  miss: 0,
};

/**
 * Resolves one shot. `rng` is injectable for deterministic tests; real
 * callers omit it and get `Math.random`.
 */
export function resolveShot(
  plan: ShotPlan,
  timing: TimingTier,
  rng: () => number = Math.random,
): ShotResult {
  const made = rng() < MAKE_CHANCE[timing];
  const pointsEarned = made ? plan.spot.points : 0;
  const coinsEarned =
    SPEECH_COINS +
    (made ? MAKE_BONUS_COINS : 0) +
    (timing === "perfect" ? PERFECT_TIMING_BONUS_COINS : 0);

  return {
    index: plan.index,
    spot: plan.spot,
    word: plan.word,
    timing,
    made,
    pointsEarned,
    coinsEarned,
  };
}

/** Longest run of consecutive makes anywhere in the results so far. */
export function computeBestStreak(results: ShotResult[]): number {
  let best = 0;
  let current = 0;
  for (const result of results) {
    current = result.made ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
}

/** Current run of consecutive makes ending at the most recent result. */
export function computeCurrentStreak(results: ShotResult[]): number {
  let current = 0;
  for (let i = results.length - 1; i >= 0; i -= 1) {
    if (!results[i].made) break;
    current += 1;
  }
  return current;
}

export function summarizeRound(results: ShotResult[]): RoundSummary {
  return {
    wordsCompleted: results.length,
    basketsMade: results.filter((r) => r.made).length,
    basketballScore: results.reduce((sum, r) => sum + r.pointsEarned, 0),
    coinsEarned: results.reduce((sum, r) => sum + r.coinsEarned, 0),
    bestStreak: computeBestStreak(results),
  };
}
