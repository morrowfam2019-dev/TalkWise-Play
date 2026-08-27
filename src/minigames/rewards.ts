/**
 * The one coin formula every mini-game uses.
 *
 * Coins are a universal TalkWise Play wallet (§19), so anything a
 * thirty-second game mints is spendable in the Adventures and Basketball
 * shops. Six infinitely repeatable games are therefore a real economy risk,
 * and §19 asks for it to be bounded rather than trusted. One formula, here,
 * rather than six — §4 is explicit that six copies of the reward logic is
 * the failure mode.
 *
 * ## The formula, in full
 *
 * ```
 *   speechParticipation = 3   if the child engaged the speech moment at all
 *                         0   if the game ran with no speech moment reached
 *   performance      = min(10, floor(score / pointsPerCoin))
 *   personalBest     = 3      if this session beat the stored best for this
 *                             (game, pack, level), else 0
 *   levelBonus       = beginner 0 | intermediate 1 | expert 2
 *
 *   base    = min(15, speechParticipation + performance + personalBest + levelBonus)
 *   coins   = max(1, round(base * dailyMultiplier(sessionsAlreadyPlayedToday)))
 * ```
 *
 * with
 *
 * ```
 *   dailyMultiplier(n) = 1.00  for n < 3      (sessions 1-3 of the day)
 *                        0.50  for n < 8      (sessions 4-8)
 *                        0.25  otherwise      (sessions 9+)
 * ```
 *
 * `pointsPerCoin` is per mini-game (`registry.ts`), tuned so a strong
 * session of any of the six earns comparable coins. Without it, a
 * thirty-second Bubble Blast round — which can score 3,000+ — would be the
 * only rational way to earn, and the other five games would be decoration.
 *
 * ## Why it is shaped this way
 *
 * - **Speech pays first, and pays whatever the score.** §19 says speech
 *   participation is the base reward. A child who says their word and then
 *   pops nothing still earns.
 * - **The round cap is deliberately below Basketball's.** Time Attack caps
 *   at 25 coins for a 30-second round with a full speech gate; a mini-game
 *   caps at 15. §2 asks for *modest* coins because these are short and
 *   replayable — a mini-game should not out-earn the game it is a snack
 *   beside.
 * - **Diminishing returns, not a wall.** The ninth session of the day still
 *   pays. Cutting a child off entirely teaches them that practising more is
 *   worthless, which is the opposite of the lesson — the same judgement
 *   GAME-002's formula documents.
 * - **The floor is 1 coin,** never zero.
 *
 * ## Anti-farming: what counts as a session
 *
 * §19 says not to reward endless tapping. Two guards, both here so all six
 * games inherit them:
 *
 * 1. `isMeaningfulSession` — a session under `MIN_SESSION_MS`, or with no
 *    correct action at all, is not practice. It still pays its floor coin
 *    (a child who tried and got nothing right must not be told they earned
 *    nothing), but it does **not** advance the daily counter, so it cannot
 *    be used to burn through the full-rate sessions and it cannot be
 *    repeated for profit.
 * 2. The performance term is capped *before* the daily multiplier, so one
 *    exceptional round cannot outrun the cap.
 *
 * Realistic ceiling: a determined day across all six mini-games earns
 * roughly 250–300 coins, against roughly 190 from a determined day of Time
 * Attack alone. Comparable, not exploitable — and it takes playing six
 * different games to get there, which is the behaviour worth rewarding.
 */

import type { MiniLearningLevel } from "@/content/minigames/types";

export const SPEECH_PARTICIPATION_COINS = 3;
export const PERFORMANCE_CAP = 10;
export const PERSONAL_BEST_COINS = 3;
export const SESSION_CAP = 15;

const LEVEL_BONUS: Record<MiniLearningLevel, number> = {
  beginner: 0,
  intermediate: 1,
  expert: 2,
};

/** Full-rate sessions per day, then half, then quarter. */
export const FULL_RATE_SESSIONS = 3;
export const HALF_RATE_SESSIONS = 8;

export function dailyMultiplier(sessionsAlreadyPlayedToday: number): number {
  if (sessionsAlreadyPlayedToday < FULL_RATE_SESSIONS) return 1;
  if (sessionsAlreadyPlayedToday < HALF_RATE_SESSIONS) return 0.5;
  return 0.25;
}

/**
 * Shortest session that counts as practice.
 *
 * Eight seconds. Long enough that a child who opens a game, taps once and
 * backs out has not "played a session"; short enough that a genuine
 * thirty-second Bubble Blast round abandoned two thirds of the way through
 * still counts. Deliberately generous — the guard is against farming, not
 * against a child who got distracted.
 */
export const MIN_SESSION_MS = 8000;

export interface MeaningfulSessionInput {
  durationMs: number;
  correctActions: number;
}

/** Whether a session should advance the daily reward counter. */
export function isMeaningfulSession(input: MeaningfulSessionInput): boolean {
  return input.durationMs >= MIN_SESSION_MS && input.correctActions > 0;
}

export interface MiniGameRewardInput {
  score: number;
  /** This mini-game's score-to-coin divisor, from `registry.ts`. */
  pointsPerCoin: number;
  level: MiniLearningLevel;
  /** Whether the child reached and engaged the game's speech moment. */
  spoke: boolean;
  isPersonalBest: boolean;
  /** Sessions of *this* mini-game already finished today, before this one. */
  sessionsAlreadyPlayedToday: number;
  /** Whether this session met the meaningful-session bar. */
  meaningful: boolean;
}

export interface MiniGameReward {
  coins: number;
  /** Broken out so the results screen can show a child where coins came
   * from — the same transparency GAME-002's results card gives. */
  breakdown: {
    speechParticipation: number;
    performance: number;
    personalBest: number;
    levelBonus: number;
    multiplier: number;
    /** True when the session was too short or too empty to count. */
    reducedForShortSession: boolean;
  };
}

export function computeMiniGameReward(
  input: MiniGameRewardInput,
): MiniGameReward {
  // A session that does not clear the meaningful bar pays the floor and
  // nothing else. It is not punished — it is simply not a practice session,
  // and it will not be counted toward the day either.
  if (!input.meaningful) {
    return {
      coins: 1,
      breakdown: {
        speechParticipation: 0,
        performance: 0,
        personalBest: 0,
        levelBonus: 0,
        multiplier: 1,
        reducedForShortSession: true,
      },
    };
  }

  const speechParticipation = input.spoke ? SPEECH_PARTICIPATION_COINS : 0;
  const divisor = Math.max(1, input.pointsPerCoin);
  const performance = Math.min(
    PERFORMANCE_CAP,
    Math.floor(Math.max(0, input.score) / divisor),
  );
  const personalBest = input.isPersonalBest ? PERSONAL_BEST_COINS : 0;
  const levelBonus = LEVEL_BONUS[input.level] ?? 0;

  const base = Math.min(
    SESSION_CAP,
    speechParticipation + performance + personalBest + levelBonus,
  );
  const multiplier = dailyMultiplier(
    Math.max(0, input.sessionsAlreadyPlayedToday),
  );

  return {
    coins: Math.max(1, Math.round(base * multiplier)),
    breakdown: {
      speechParticipation,
      performance,
      personalBest,
      levelBonus,
      multiplier,
      reducedForShortSession: false,
    },
  };
}
