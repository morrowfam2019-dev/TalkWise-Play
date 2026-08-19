/**
 * Speech Basketball's coin rewards.
 *
 * Coins are a universal TalkWise Play wallet, so anything Basketball mints is
 * spendable in the Adventures shop too. That makes an infinitely repeatable
 * 30-second mode a genuine economy risk, and the spec asks for it to be
 * bounded rather than trusted.
 *
 * ## The Time Attack formula, in full
 *
 * ```
 *   speechGate      = 5                       always, for completing the gate
 *   performance     = min(15, floor(score/4)) the basketball part, capped
 *   personalBest    = 5 if this round beat the stored best for this
 *                     (sound, difficulty), else 0
 *   difficultyBonus = easy 0 | intermediate 1 | hard 2
 *
 *   base    = min(25, speechGate + performance + personalBest + difficultyBonus)
 *   coins   = max(1, round(base * dailyMultiplier(roundsAlreadyPlayedToday)))
 * ```
 *
 * with
 *
 * ```
 *   dailyMultiplier(n) = 1.00  for n < 5      (rounds 1-5 of the day)
 *                        0.50  for n < 10     (rounds 6-10)
 *                        0.25  otherwise      (rounds 11+)
 * ```
 *
 * ## Why it is shaped this way
 *
 * - **The speech gate always pays, and pays first.** A child who says their
 *   target and then shoots badly still earns. Speech practice is the point;
 *   basketball is the reward for it, not the thing being graded.
 * - **Performance is capped before the daily multiplier**, so a single
 *   exceptional round cannot outrun the cap.
 * - **Diminishing returns, not a hard stop.** The eleventh round of the day
 *   still pays something. Cutting a child off entirely would teach them that
 *   practising more is worthless, which is the opposite of the lesson.
 * - **The floor is 1 coin.** Never zero — a completed speech gate is never
 *   worth nothing.
 *
 * Realistic ceiling: about 190 coins from a determined day of Time Attack,
 * versus roughly 80 from ten Shootout rounds. Comparable, not exploitable.
 */

import type { SpeechDifficulty } from "@/content/speech/engine";

export const TIME_ATTACK_GATE_COINS = 5;
export const TIME_ATTACK_PERFORMANCE_CAP = 15;
export const TIME_ATTACK_POINTS_PER_COIN = 4;
export const TIME_ATTACK_PERSONAL_BEST_COINS = 5;
export const TIME_ATTACK_ROUND_CAP = 25;

const DIFFICULTY_BONUS: Record<SpeechDifficulty, number> = {
  easy: 0,
  intermediate: 1,
  hard: 2,
};

/** Full-rate rounds per day, then half, then quarter. */
export const FULL_RATE_ROUNDS = 5;
export const HALF_RATE_ROUNDS = 10;

export function dailyMultiplier(roundsAlreadyPlayedToday: number): number {
  if (roundsAlreadyPlayedToday < FULL_RATE_ROUNDS) return 1;
  if (roundsAlreadyPlayedToday < HALF_RATE_ROUNDS) return 0.5;
  return 0.25;
}

export interface TimeAttackRewardInput {
  score: number;
  difficulty: SpeechDifficulty;
  isPersonalBest: boolean;
  /** Time Attack rounds already finished today, *before* this one. */
  roundsAlreadyPlayedToday: number;
}

export interface TimeAttackReward {
  coins: number;
  /** Broken out so the results screen can show the child where coins came from. */
  breakdown: {
    speechGate: number;
    performance: number;
    personalBest: number;
    difficultyBonus: number;
    multiplier: number;
  };
}

export function computeTimeAttackReward(
  input: TimeAttackRewardInput,
): TimeAttackReward {
  const speechGate = TIME_ATTACK_GATE_COINS;
  const performance = Math.min(
    TIME_ATTACK_PERFORMANCE_CAP,
    Math.floor(Math.max(0, input.score) / TIME_ATTACK_POINTS_PER_COIN),
  );
  const personalBest = input.isPersonalBest
    ? TIME_ATTACK_PERSONAL_BEST_COINS
    : 0;
  const difficultyBonus = DIFFICULTY_BONUS[input.difficulty] ?? 0;

  const base = Math.min(
    TIME_ATTACK_ROUND_CAP,
    speechGate + performance + personalBest + difficultyBonus,
  );
  const multiplier = dailyMultiplier(
    Math.max(0, input.roundsAlreadyPlayedToday),
  );

  return {
    coins: Math.max(1, Math.round(base * multiplier)),
    breakdown: {
      speechGate,
      performance,
      personalBest,
      difficultyBonus,
      multiplier,
    },
  };
}
