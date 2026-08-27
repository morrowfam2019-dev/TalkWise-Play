"use client";

/**
 * One mini-game session, start to finish.
 *
 * This is the piece §4 exists for. Every mini-game needs the same seven
 * things around its actual gameplay:
 *
 *   1. a phase machine (intro → playing → results),
 *   2. a scored session,
 *   3. the power-up layer,
 *   4. a personal-best check taken *before* the save,
 *   5. the coin calculation with its anti-farming guards,
 *   6. one write into that game's own save namespace,
 *   7. analytics events at the right moments.
 *
 * All seven live here, once. A mini-game supplies its own gameplay and calls
 * `finish()`; it does not compute coins, does not know the daily multiplier,
 * and cannot write to another game's namespace — `gameId` is fixed at the
 * top and threaded through.
 *
 * ## The ordering that matters
 *
 * The personal-best check is read **before** `recordMiniGameSession` runs.
 * Afterwards the stored best *is* this session's score and the comparison is
 * always false, which would silently delete the personal-best bonus from the
 * formula. Same trap GAME-002's Time Attack documents.
 */

import { useCallback, useRef, useState } from "react";
import type {
  ContentPackId,
  MiniLearningLevel,
} from "@/content/minigames/types";
import type { MiniGameId } from "@/platform/games/registry";
import {
  getMiniPlaysToday,
  isMiniPersonalBest,
} from "@/player/games/minigames";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { emitMiniGameEvent } from "./analytics";
import { miniAudio } from "./audio";
import { usePowerUps, type PowerUpApi } from "./powerups";
import {
  computeMiniGameReward,
  isMeaningfulSession,
  type MiniGameReward,
} from "./rewards";
import type { MiniSessionSummary } from "./session";
import { useMiniGameSession, type MiniGameSessionApi } from "./useMiniGameSession";
import type { MiniGameDefinition } from "./registry";

export type RunPhase = "intro" | "playing" | "results";

export interface FinishOptions {
  /** Whether the child played the session through rather than backing out. */
  completed: boolean;
  /** Permanent, game-defined ids this session completed (§20's `collected`). */
  collected?: string[];
}

export interface MiniGameRunApi {
  phase: RunPhase;
  session: MiniGameSessionApi;
  powerUps: PowerUpApi;
  /** True once the child has engaged this session's speech moment. */
  spoke: boolean;
  /** Records that the speech moment happened. Idempotent. */
  markSpoke: () => void;
  /** Moves from intro into play and starts the session clock. */
  begin: () => void;
  /** Ends the session, banks it, and shows results. Safe to call twice. */
  finish: (options: FinishOptions) => void;
  /** Starts a fresh session with the same pack and level. */
  replay: () => void;
  /** The finished session, once there is one. */
  summary: MiniSessionSummary | null;
  reward: MiniGameReward | null;
  /** Whether the finished session set a new personal best. */
  wasPersonalBest: boolean;
  /** Stored best score for this pack and level, read live. */
  bestScore: number;
}

export function useMiniGameRun(options: {
  gameId: MiniGameId;
  definition: MiniGameDefinition;
  packId: ContentPackId;
  level: MiniLearningLevel;
}): MiniGameRunApi {
  const { gameId, definition, packId, level } = options;
  const { profile, recordMiniGameSession } = usePlayerProfile();

  const [phase, setPhase] = useState<RunPhase>("intro");
  const [summary, setSummary] = useState<MiniSessionSummary | null>(null);
  const [reward, setReward] = useState<MiniGameReward | null>(null);
  const [wasPersonalBest, setWasPersonalBest] = useState(false);
  const [spoke, setSpoke] = useState(false);
  const finishedRef = useRef(false);

  const powerUps = usePowerUps({
    enabled: definition.powerUps,
    gameId,
  });

  const session = useMiniGameSession({
    pointsPerCorrect: definition.pointsPerCorrect,
    onCorrect: powerUps.offerCombo,
  });

  const state = profile.games[gameId];
  const bestScore = state.records[`${packId}:${level}`]?.bestScore ?? 0;

  const markSpoke = useCallback(() => setSpoke(true), []);

  const begin = useCallback(() => {
    setPhase("playing");
    session.begin();
    emitMiniGameEvent({ name: "game_started", gameId, packId, level });
  }, [session, gameId, packId, level]);

  const finish = useCallback(
    ({ completed, collected }: FinishOptions) => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      const finished = session.finish();
      powerUps.clear();
      miniAudio.finish();

      const meaningful = isMeaningfulSession({
        durationMs: finished.durationMs,
        correctActions: finished.correct,
      });

      // Read both of these off the *pre-merge* profile. See the ordering
      // note at the top of this file.
      const personalBest = isMiniPersonalBest(state, packId, level, finished.score);
      const sessionsToday = getMiniPlaysToday(state);

      const earned = computeMiniGameReward({
        score: finished.score,
        pointsPerCoin: definition.pointsPerCoin,
        level,
        spoke,
        isPersonalBest: personalBest,
        sessionsAlreadyPlayedToday: sessionsToday,
        meaningful,
      });

      recordMiniGameSession(gameId, {
        packId,
        level,
        score: finished.score,
        accuracy: finished.accuracy,
        bestCombo: finished.bestCombo,
        completed,
        countsTowardDaily: meaningful,
        collected,
        coinsEarned: earned.coins,
      });

      setSummary(finished);
      setReward(earned);
      setWasPersonalBest(personalBest && finished.score > 0);
      setPhase("results");

      emitMiniGameEvent({
        name: "game_completed",
        gameId,
        packId,
        level,
        durationMs: finished.durationMs,
        score: finished.score,
        accuracy: finished.accuracy,
        bestCombo: finished.bestCombo,
        outcome: completed ? "completed" : "abandoned",
      });
      emitMiniGameEvent({
        name: "round_score",
        gameId,
        packId,
        level,
        score: finished.score,
      });
    },
    [
      session,
      powerUps,
      state,
      packId,
      level,
      definition.pointsPerCoin,
      spoke,
      recordMiniGameSession,
      gameId,
    ],
  );

  const replay = useCallback(() => {
    finishedRef.current = false;
    session.reset();
    powerUps.clear();
    setSummary(null);
    setReward(null);
    setWasPersonalBest(false);
    setSpoke(false);
    setPhase("intro");
    emitMiniGameEvent({ name: "replay_clicked", gameId, packId, level });
  }, [session, powerUps, gameId, packId, level]);

  return {
    phase,
    session,
    powerUps,
    spoke,
    markSpoke,
    begin,
    finish,
    replay,
    summary,
    reward,
    wasPersonalBest,
    bestScore,
  };
}
