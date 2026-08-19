/**
 * MODE 03 — 1-on-1 Clutch: the rules model.
 *
 * **Not yet wired to any screen.** The mode ships as Coming Soon in this
 * update. What is here is the part that was worth deciding now rather than
 * later: the possession state machine, the shot-clock model, and — most
 * importantly — the accessibility rules, encoded as code rather than left as
 * a paragraph someone has to remember when they build the UI.
 *
 * Everything the finished mode needs beyond this file already exists:
 * per-word sentence recognition (`speech/recognition.ts` `PhraseRecognizer`),
 * the word-by-word gate UI (`ui/SpeechGate.tsx`), the difficulty model and
 * content engine, the court/hoop/baller scene, the shot meter, and a
 * `clutch` slot in the save schema. Building the mode is a rendering and
 * choreography job, not a design job.
 *
 * ## THE ACCESSIBILITY RULE — read before changing anything here
 *
 * The shot clock and the closing defender are GAME mechanics. They must never
 * imply that the learner should clinically speak faster, that stuttering is
 * failure, that slower speech is incorrect, or that a speech difference
 * deserves punishment.
 *
 * Concretely, and enforced by the functions below:
 *
 * - Running out of clock **never** costs the child anything they earned.
 *   `resolveExpiry` awards full participation credit for the words they did
 *   say, every time.
 * - Words already recognised **stay** recognised across a possession. A child
 *   repairs one word; the sentence never resets under them.
 * - There is no failure vocabulary anywhere in the outcome model. The
 *   defender contests the shot; the child is never the thing that failed.
 *
 * ## THE FUTURE FLUENCY RULE
 *
 * Do not generalise this mode's time pressure to future fluency or stuttering
 * tracks. Some learning goals deliberately reward controlled pacing, smooth
 * starts, pauses and a reduced rate — the opposite of a shot clock. That is
 * why `ClutchRules` carries `shotClockSeconds` as data on the mode rather
 * than as a constant of Basketball: a future practice track can set it to
 * `null` and the same possession machine runs with no clock at all.
 */

import type { SpeechDifficulty } from "@/content/speech/engine";

/** Where a possession is. */
export type ClutchPhase =
  | "set"
  | "closeout"
  | "speech"
  | "shot"
  | "result"
  | "complete";

export interface ClutchRules {
  /**
   * Seconds to complete the speech target, or `null` for no clock at all.
   * Null is a first-class value, not a disabled state — see the fluency rule.
   */
  shotClockSeconds: number | null;
  /** Possessions in a game. */
  possessions: number;
  /** Seconds the defender takes to close out, purely cosmetic pressure. */
  closeoutSeconds: number;
}

/**
 * Per-difficulty rules. The clock loosens as the target gets longer, so Hard
 * is harder because the *sentence* is longer, never because the child is
 * given proportionally less time to say it.
 */
const RULES: Record<SpeechDifficulty, ClutchRules> = {
  easy: { shotClockSeconds: null, possessions: 5, closeoutSeconds: 2.4 },
  intermediate: { shotClockSeconds: 12, possessions: 7, closeoutSeconds: 1.9 },
  hard: { shotClockSeconds: 20, possessions: 7, closeoutSeconds: 1.6 },
};

export function getClutchRules(difficulty: SpeechDifficulty): ClutchRules {
  return RULES[difficulty] ?? RULES.intermediate;
}

/** What happened on one possession. */
export type ClutchOutcome = "shot-unlocked" | "contested";

export interface ClutchPossessionResult {
  outcome: ClutchOutcome;
  /** Word ids recognised this possession — carried into the next attempt. */
  matchedWordIds: string[];
  /** Words the child said, whatever the clock did. Always earned. */
  participationWords: number;
  /** Kid-facing line. Never negative, in either branch. */
  message: string;
}

/** The clock ran out. The child keeps everything they said. */
export function resolveExpiry(
  matchedWordIds: string[],
): ClutchPossessionResult {
  return {
    outcome: "contested",
    matchedWordIds,
    // Full credit for the words spoken. Running out of time costs nothing
    // that was earned — this is the accessibility rule, in code.
    participationWords: matchedWordIds.length,
    message:
      matchedWordIds.length > 0
        ? "Good talking! The defender got that one — your ball again."
        : "The defender got that one. Your ball again!",
  };
}

/** The target was completed and the shot is live. */
export function resolveCompletion(
  matchedWordIds: string[],
): ClutchPossessionResult {
  return {
    outcome: "shot-unlocked",
    matchedWordIds,
    participationWords: matchedWordIds.length,
    message: "Nice speaking — take the shot!",
  };
}

/**
 * Words carried into the next attempt at the same target.
 *
 * Always everything already recognised: a child repairs the one word they
 * missed rather than repeating a sentence they mostly said. Kept as a named
 * function so that no future edit can quietly turn it into a reset.
 */
export function carryForward(matchedWordIds: string[]): string[] {
  return [...matchedWordIds];
}
