/**
 * The mini-game session engine — pure data and functions, no React.
 *
 * Every mini-game keeps the same running tally: score, correct and wrong
 * actions, the current combo, the best combo, accuracy. §4 is explicit that
 * six copies of this is the thing to avoid, so it lives here once and is
 * driven by the `useMiniGameSession` hook.
 *
 * Pure on purpose: this is the part of a mini-game that can be verified in
 * Node with no browser (`npm run verify:minigames`), which is the only
 * practical way to prove the combo rule and the accuracy maths across six
 * games at once.
 *
 * ## The combo rule, and why wrong answers do not punish
 *
 * A correct action raises the combo by one; the score gains
 * `pointsPerCorrect × multiplier(combo)`. A wrong action **resets the combo
 * to zero and takes nothing away** — no negative points, no lost time, no
 * "WRONG". §7's Bubble Blast brief asks for exactly this ("gentle neutral
 * feedback, no harsh failure") and §17 forbids the failure language. The
 * combo is a reward for a run of successes, not a punishment for ending
 * one, and losing a x3 multiplier is already all the consequence a
 * four-year-old needs.
 */

export interface MiniSessionState {
  score: number;
  /** Correct actions this session. */
  correct: number;
  /** Wrong actions this session. Recorded for accuracy, never for scoring. */
  wrong: number;
  /** Current unbroken run of correct actions. */
  combo: number;
  /** Longest combo reached this session. */
  bestCombo: number;
}

export const EMPTY_SESSION: MiniSessionState = {
  score: 0,
  correct: 0,
  wrong: 0,
  combo: 0,
  bestCombo: 0,
};

/**
 * Combo multipliers, and where they stop.
 *
 * x1 → x2 at three in a row → x3 at six → x4 at ten. It caps at x4 rather
 * than growing without bound: an uncapped multiplier means a single lucky
 * run dominates every personal best a child ever sets afterwards, which
 * turns a replayable game into a one-time high score they can never beat.
 */
export const COMBO_THRESHOLDS: { at: number; multiplier: number }[] = [
  { at: 10, multiplier: 4 },
  { at: 6, multiplier: 3 },
  { at: 3, multiplier: 2 },
];

export const MAX_COMBO_MULTIPLIER = 4;

/** The multiplier a combo length earns. */
export function comboMultiplier(combo: number): number {
  for (const tier of COMBO_THRESHOLDS) {
    if (combo >= tier.at) return tier.multiplier;
  }
  return 1;
}

/**
 * Applies one correct action.
 *
 * The multiplier is read from the combo *after* incrementing, so the third
 * correct answer in a row is itself worth x2 — a child who has just earned
 * a multiplier should see it on the hit that earned it, not the one after.
 */
export function scoreCorrect(
  state: MiniSessionState,
  pointsPerCorrect: number,
): MiniSessionState {
  const combo = state.combo + 1;
  return {
    score: state.score + pointsPerCorrect * comboMultiplier(combo),
    correct: state.correct + 1,
    wrong: state.wrong,
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
  };
}

/** Applies one wrong action. Breaks the combo, costs nothing else. */
export function scoreWrong(state: MiniSessionState): MiniSessionState {
  return {
    score: state.score,
    correct: state.correct,
    wrong: state.wrong + 1,
    combo: 0,
    bestCombo: state.bestCombo,
  };
}

/**
 * Whole-percent accuracy, 0–100.
 *
 * A session with no actions at all is 0%, not 100%: an untouched game is
 * not a perfect one. Shown to parents in results, never to shame a child —
 * the results screen leads with what they did, not what they missed.
 */
export function sessionAccuracy(state: MiniSessionState): number {
  const attempts = state.correct + state.wrong;
  if (attempts === 0) return 0;
  return Math.round((state.correct / attempts) * 100);
}

/** A one-line summary a results screen and the save layer both read. */
export interface MiniSessionSummary extends MiniSessionState {
  accuracy: number;
  durationMs: number;
}

export function summarize(
  state: MiniSessionState,
  durationMs: number,
): MiniSessionSummary {
  return { ...state, accuracy: sessionAccuracy(state), durationMs };
}
