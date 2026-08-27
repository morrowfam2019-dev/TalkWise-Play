"use client";

/**
 * The round clock, shared by every timed mini-game.
 *
 * ## Why it ticks on rAF rather than setInterval
 *
 * A `setInterval` clock drifts, and on mobile Safari it is throttled hard
 * the moment the tab is backgrounded — which in a thirty-second round means
 * a child who takes a phone call comes back to a clock that thinks four
 * seconds have passed. This computes remaining time from a wall-clock
 * deadline every animation frame, so the displayed time is always the true
 * time and a backgrounded round ends when it should have.
 *
 * ## Pausing
 *
 * `pause` shifts the deadline rather than stopping a counter, so no time is
 * lost or gained across a pause. Used when a speech gate opens mid-round.
 *
 * The loop lives in an effect keyed on `running` rather than in a
 * self-scheduling callback: a callback that requests its own next frame has
 * to reference itself before it exists, and the version of it captured by
 * the first frame then never sees a later prop change.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { miniAudio } from "./audio";

export interface CountdownApi {
  /** Whole seconds remaining, for display. */
  secondsRemaining: number;
  /** Fractional seconds remaining, for progress bars. */
  remainingMs: number;
  running: boolean;
  start: (durationMs?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

/** Seconds at which the clock starts pipping. */
export const URGENT_SECONDS = 5;

export function useCountdown(options: {
  durationMs: number;
  onExpire: () => void;
  /** Play the final-seconds pips. */
  urgentTicks?: boolean;
  muted?: boolean;
}): CountdownApi {
  const { durationMs, onExpire, urgentTicks = true, muted = false } = options;

  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [running, setRunning] = useState(false);

  const deadlineRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);
  const lastPipRef = useRef(-1);
  const expiredRef = useRef(false);

  // Held in a ref so a caller's inline arrow does not restart the clock on
  // every render — the classic timer-in-React bug.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!running) return;

    let frame = 0;
    const step = () => {
      const left = Math.max(0, deadlineRef.current - Date.now());
      setRemainingMs(left);

      if (urgentTicks && !muted) {
        const second = Math.ceil(left / 1000);
        if (
          second <= URGENT_SECONDS &&
          second > 0 &&
          second !== lastPipRef.current
        ) {
          lastPipRef.current = second;
          miniAudio.urgentTick();
        }
      }

      if (left <= 0) {
        if (!expiredRef.current) {
          expiredRef.current = true;
          setRunning(false);
          onExpireRef.current();
        }
        return;
      }
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [running, urgentTicks, muted]);

  const start = useCallback(
    (overrideMs?: number) => {
      const total = overrideMs ?? durationMs;
      expiredRef.current = false;
      lastPipRef.current = -1;
      pausedAtRef.current = null;
      deadlineRef.current = Date.now() + total;
      setRemainingMs(total);
      setRunning(true);
    },
    [durationMs],
  );

  const pause = useCallback(() => {
    if (pausedAtRef.current !== null) return;
    pausedAtRef.current = Date.now();
    setRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (pausedAtRef.current === null) return;
    // Shift the deadline by exactly the paused duration: no time lost, none
    // gained, whatever the browser did while we were not looking.
    deadlineRef.current += Date.now() - pausedAtRef.current;
    pausedAtRef.current = null;
    setRunning(true);
  }, []);

  const stop = useCallback(() => {
    expiredRef.current = true;
    pausedAtRef.current = null;
    setRunning(false);
  }, []);

  return {
    secondsRemaining: Math.ceil(remainingMs / 1000),
    remainingMs,
    running,
    start,
    pause,
    resume,
    stop,
  };
}
