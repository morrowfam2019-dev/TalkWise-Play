"use client";

/**
 * The hook every mini-game runs on.
 *
 * Wraps the pure engine in `session.ts` with the things a React game
 * actually needs: stable callbacks, sound, combo notification, and a
 * duration measured from the moment play really started rather than from
 * mount.
 *
 * A mini-game calls `correct()` and `wrong()` and reads `state`. It does not
 * do its own scoring, its own combo maths, or its own accuracy — that is
 * §4's rule about not shipping six copies of the same logic, applied to the
 * one piece of logic every game genuinely shares.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { miniAudio } from "./audio";
import {
  EMPTY_SESSION,
  comboMultiplier,
  scoreCorrect,
  scoreWrong,
  summarize,
  type MiniSessionState,
  type MiniSessionSummary,
} from "./session";

export interface MiniGameSessionApi {
  state: MiniSessionState;
  /** The multiplier the next correct action would earn. */
  multiplier: number;
  /** Marks the moment play begins, for duration measurement. */
  begin: () => void;
  /** Records one correct action. Returns the new combo length. */
  correct: () => number;
  /** Records one wrong action. Gentle by design — nothing is deducted. */
  wrong: () => void;
  /** Everything the results screen and the save layer need. */
  finish: () => MiniSessionSummary;
  /** Resets for a replay without remounting the game. */
  reset: () => void;
  /** How long play has been running, in milliseconds. */
  elapsedMs: () => number;
}

export function useMiniGameSession(options: {
  pointsPerCorrect: number;
  /** Called when the combo crosses into a higher multiplier. Mini-games use
   * it to fire a power-up or a celebration. */
  onComboUp?: (multiplier: number, combo: number) => void;
  /** Called on every correct action, with the new combo length. */
  onCorrect?: (combo: number) => void;
  muted?: boolean;
}): MiniGameSessionApi {
  const { pointsPerCorrect, onComboUp, onCorrect, muted = false } = options;
  const [state, setState] = useState<MiniSessionState>(EMPTY_SESSION);
  const stateRef = useRef<MiniSessionState>(EMPTY_SESSION);
  const startedAtRef = useRef<number | null>(null);
  const endedAtRef = useRef<number | null>(null);

  const begin = useCallback(() => {
    startedAtRef.current = Date.now();
    endedAtRef.current = null;
  }, []);

  const elapsedMs = useCallback(() => {
    if (startedAtRef.current === null) return 0;
    return (endedAtRef.current ?? Date.now()) - startedAtRef.current;
  }, []);

  const correct = useCallback(() => {
    const previousMultiplier = comboMultiplier(stateRef.current.combo);
    const next = scoreCorrect(stateRef.current, pointsPerCorrect);
    stateRef.current = next;
    setState(next);

    const nextMultiplier = comboMultiplier(next.combo);
    if (!muted) {
      miniAudio.correct(nextMultiplier);
      if (nextMultiplier > previousMultiplier) {
        miniAudio.comboUp(nextMultiplier);
      }
    }
    if (nextMultiplier > previousMultiplier) {
      onComboUp?.(nextMultiplier, next.combo);
    }
    onCorrect?.(next.combo);
    return next.combo;
  }, [pointsPerCorrect, muted, onComboUp, onCorrect]);

  const wrong = useCallback(() => {
    const next = scoreWrong(stateRef.current);
    stateRef.current = next;
    setState(next);
    if (!muted) miniAudio.gentleMiss();
  }, [muted]);

  const finish = useCallback(() => {
    endedAtRef.current = Date.now();
    return summarize(stateRef.current, elapsedMs());
  }, [elapsedMs]);

  const reset = useCallback(() => {
    stateRef.current = EMPTY_SESSION;
    setState(EMPTY_SESSION);
    startedAtRef.current = null;
    endedAtRef.current = null;
  }, []);

  const multiplier = useMemo(
    () => comboMultiplier(state.combo + 1),
    [state.combo],
  );

  return { state, multiplier, begin, correct, wrong, finish, reset, elapsedMs };
}
