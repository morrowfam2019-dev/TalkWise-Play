"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listLevels } from "@/content/speech";
import {
  requestSpeechTargets,
  type SpeechDifficulty,
} from "@/content/speech/engine";
import { GAME_BASKETBALL } from "@/platform/games/registry";
import { getModeRecord, getPlaysToday } from "@/player/games/basketball";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import {
  BALL_POOL_SIZE,
  BALL_RETURN_MS,
  TIME_ATTACK_SECONDS,
  ballCounts,
  createBallPool,
  getArcadeAssist,
  isShootableDrag,
  launchBall,
  launchFromDrag,
  pointsForBasket,
  streakCallout,
  summarizeTimeAttack,
  type ArcadeBall,
  type DragGesture,
} from "../../core/arcade";
import { hoopAudio } from "../../core/audio";
import { computeTimeAttackReward } from "../../core/rewards";
import { ArcadeScene } from "../../scene/ArcadeScene";
import { SpeechGate } from "../../ui/SpeechGate";
import {
  ArcadeCountdown,
  StreakBanner,
  TimeAttackHud,
} from "../../ui/TimeAttackHud";
import { TimeAttackResults } from "../../ui/TimeAttackResults";

type Phase = "gate" | "countdown" | "playing" | "buzzer" | "results";

/** How long the countdown holds on each of 3, 2, 1, GO. */
const COUNTDOWN_STEP_MS = 700;
/** Grace after the buzzer for balls already in the air to land. */
const BUZZER_GRACE_MS = 1400;
const STREAK_BANNER_MS = 1100;

/** Everything a round accumulates while it is being played. */
interface RoundTally {
  score: number;
  made: number;
  shots: number;
  streak: number;
  bestStreak: number;
}

/** A round's tallies at zero. Always spread, never assigned by reference. */
const EMPTY_TALLY: RoundTally = {
  score: 0,
  made: 0,
  shots: 0,
  streak: 0,
  bestStreak: 0,
};

/**
 * MODE 02 — Time Attack.
 *
 * Say the target **once** to unlock a 30-second arcade shooting frenzy. That
 * one-gate-per-round rule is the whole design: in Shootout speech is the
 * price of every shot, here speech is the price of *admission* and the reward
 * is an uninterrupted run of basketball. Re-gating between shots would turn
 * this back into Shootout with a clock on it.
 *
 * Shooting is direct manipulation — touch the screen, drag up toward the
 * hoop, release. No timing meter appears anywhere in this mode.
 */
export function TimeAttackMode({
  soundId,
  difficulty,
  onExit,
  onChangeSound,
  onChangeDifficulty,
  onBackToBasketball,
}: {
  soundId: string;
  difficulty: SpeechDifficulty;
  onExit: () => void;
  onChangeSound: () => void;
  onChangeDifficulty: () => void;
  onBackToBasketball: () => void;
}) {
  const level = useMemo(
    () => listLevels().find((l) => l.sound.id === soundId),
    [soundId],
  );

  // A single gate target — the one distinguishing content request of this
  // mode, and exactly what the content engine's `targetCount` is for.
  const [runId, setRunId] = useState(0);
  const gateTarget = useMemo(() => {
    const targets = requestSpeechTargets({
      gameId: GAME_BASKETBALL,
      mode: "timeAttack",
      soundId,
      difficulty,
      targetCount: 1,
    });
    return targets[0] ?? null;
    // `runId` deliberately re-rolls nothing today (selection is deterministic)
    // but keeps the gate remounting cleanly on Play Again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundId, difficulty, runId]);

  const { profile, basketball, recordBasketballRound, setMicEnabled } =
    usePlayerProfile();

  const [phase, setPhase] = useState<Phase>("gate");
  const [countdownValue, setCountdownValue] = useState(3);
  const [secondsRemaining, setSecondsRemaining] = useState(TIME_ATTACK_SECONDS);
  const [ballReady, setBallReady] = useState(false);
  const [streakLabel, setStreakLabel] = useState<string | null>(null);

  /**
   * Live round tallies.
   *
   * Accumulated in refs because they are written from the frame loop, and
   * mirrored into one piece of state for rendering. Two copies rather than
   * one because neither alone works: state cannot be read synchronously by
   * the next ball event in the same frame, and refs cannot drive a render.
   */
  const tallyRef = useRef({ ...EMPTY_TALLY });
  const [tally, setTally] = useState<RoundTally>({ ...EMPTY_TALLY });
  const publishTally = useCallback(() => {
    setTally({ ...tallyRef.current });
  }, []);

  // Created once and never replaced, so every ball object is reused for the
  // whole session — no allocation per shot.
  const [pool] = useState(() => createBallPool(BALL_POOL_SIZE));

  const endAtRef = useRef(0);
  const phaseRef = useRef<Phase>("gate");
  const lastTickRef = useRef(TIME_ATTACK_SECONDS);
  const recordedRef = useRef(false);
  const returnTimerRef = useRef<number | null>(null);
  const streakTimerRef = useRef<number | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  // Captured before this round can write over them.
  const [snapshot, setSnapshot] = useState(() => ({
    previousBest: getModeRecord(basketball, "timeAttack", soundId, difficulty)
      .bestScore,
    playsToday: getPlaysToday(basketball, "timeAttack"),
  }));

  const [reward, setReward] = useState({ coins: 0, reduced: false });

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    hoopAudio.unlock();
    hoopAudio.startMusic();
    return () => hoopAudio.stopMusic();
  }, []);

  useEffect(() => {
    return () => {
      if (returnTimerRef.current !== null)
        window.clearTimeout(returnTimerRef.current);
      if (streakTimerRef.current !== null)
        window.clearTimeout(streakTimerRef.current);
    };
  }, []);

  // --- iOS: stop the page moving under the game ---------------------------
  //
  // `touch-action: none` covers most of it, but iOS Safari still rubber-bands
  // the document and can start an edge back-swipe mid-flick. A non-passive
  // `touchmove` listener that preventDefaults is the only thing that reliably
  // suppresses both, and it has to be attached imperatively because React
  // registers its own touch handlers as passive.
  //
  // Scoped to the drag surface, NOT the whole mode: preventDefaulting
  // `touchstart` at the root would suppress the synthetic click on the speech
  // gate's own buttons, which would leave a child unable to start the round
  // on the exact devices this is meant to help.
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const block = (event: TouchEvent) => {
      if (event.cancelable) event.preventDefault();
    };
    surface.addEventListener("touchstart", block, { passive: false });
    surface.addEventListener("touchmove", block, { passive: false });
    return () => {
      surface.removeEventListener("touchstart", block);
      surface.removeEventListener("touchmove", block);
    };
  }, []);

  // --- Countdown ----------------------------------------------------------

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdownValue > 0) {
      hoopAudio.countdownTick();
      const id = window.setTimeout(
        () => setCountdownValue((value) => value - 1),
        COUNTDOWN_STEP_MS,
      );
      return () => window.clearTimeout(id);
    }
    hoopAudio.countdownGo();
    const id = window.setTimeout(() => {
      endAtRef.current = Date.now() + TIME_ATTACK_SECONDS * 1000;
      lastTickRef.current = TIME_ATTACK_SECONDS;
      setSecondsRemaining(TIME_ATTACK_SECONDS);
      setBallReady(true);
      setPhase("playing");
    }, COUNTDOWN_STEP_MS);
    return () => window.clearTimeout(id);
  }, [phase, countdownValue]);

  // --- The clock ----------------------------------------------------------

  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;

    const tick = () => {
      const remaining = Math.max(0, (endAtRef.current - Date.now()) / 1000);
      setSecondsRemaining(remaining);

      const whole = Math.ceil(remaining);
      if (whole !== lastTickRef.current) {
        lastTickRef.current = whole;
        if (whole > 0 && whole <= 5) hoopAudio.urgentTick();
      }

      if (remaining <= 0) {
        hoopAudio.finalBuzzer();
        setBallReady(false);
        setPhase("buzzer");
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // After the buzzer, hold briefly so a ball released in time can still drop.
  useEffect(() => {
    if (phase !== "buzzer") return;
    const id = window.setTimeout(() => setPhase("results"), BUZZER_GRACE_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  // --- Ball resolution ----------------------------------------------------

  const handleBallEvent = useCallback((ball: ArcadeBall) => {
    if (ball.hitFloor) hoopAudio.bounce();
    if (ball.hitRim) hoopAudio.backboard();

    if (ball.outcome === "in-flight" || ball.counted) return;
    ball.counted = true;

    const tallies = tallyRef.current;

    if (ball.outcome !== "made" || !ballCounts(ball)) {
      // A miss ends the streak and says nothing about it. There is
      // deliberately no negative callout anywhere in this mode.
      tallies.streak = 0;
      publishTally();
      return;
    }

    const remaining = Math.max(0, (endAtRef.current - Date.now()) / 1000);
    tallies.score += pointsForBasket(remaining);
    tallies.made += 1;
    tallies.streak += 1;
    tallies.bestStreak = Math.max(tallies.bestStreak, tallies.streak);

    publishTally();
    hoopAudio.score();

    const callout = streakCallout(tallies.streak);
    if (callout) {
      hoopAudio.streak();
      setStreakLabel(callout);
      if (streakTimerRef.current !== null)
        window.clearTimeout(streakTimerRef.current);
      streakTimerRef.current = window.setTimeout(
        () => setStreakLabel(null),
        STREAK_BANNER_MS,
      );
    }
  }, [publishTally]);

  // --- Shooting -----------------------------------------------------------

  const dragRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (phaseRef.current !== "playing") return;
      // Only the first finger down shoots. A second touch during a drag is
      // ignored outright rather than hijacking the gesture.
      if (dragRef.current !== null) return;
      dragRef.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [],
  );

  const releaseDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);

      if (phaseRef.current !== "playing") return;
      if (!ballReady) return;

      const gesture: DragGesture = {
        dx: event.clientX - drag.x,
        dy: event.clientY - drag.y,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      };
      // A tap, or a downward swipe, is not a shot — no ball is spent.
      if (!isShootableDrag(gesture)) return;

      const velocity = launchFromDrag(gesture, getArcadeAssist(difficulty));
      const ball = launchBall(pool, velocity, true);
      // Every ball is live: the pool is doing its job, so the flick is
      // dropped rather than growing the scene without bound.
      if (!ball) return;

      tallyRef.current.shots += 1;
      publishTally();
      hoopAudio.release();
      setBallReady(false);
      if (returnTimerRef.current !== null)
        window.clearTimeout(returnTimerRef.current);
      returnTimerRef.current = window.setTimeout(() => {
        if (phaseRef.current === "playing") setBallReady(true);
      }, BALL_RETURN_MS);
    },
    [ballReady, difficulty, pool, publishTally],
  );

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
    },
    [],
  );

  // --- Gate, results, replay ---------------------------------------------

  const handleUnlock = useCallback(() => {
    setCountdownValue(3);
    setPhase("countdown");
  }, []);

  const summary = useMemo(
    () =>
      summarizeTimeAttack({
        score: tally.score,
        basketsMade: tally.made,
        shotsTaken: tally.shots,
        bestStreak: tally.bestStreak,
      }),
    [tally],
  );

  useEffect(() => {
    if (phase !== "results" || recordedRef.current) return;
    recordedRef.current = true;

    const finalTally = tallyRef.current;
    const finalScore = finalTally.score;
    const isPersonalBest = finalScore > snapshot.previousBest;
    const earned = computeTimeAttackReward({
      score: finalScore,
      difficulty,
      isPersonalBest,
      roundsAlreadyPlayedToday: snapshot.playsToday,
    });
    setReward({ coins: earned.coins, reduced: earned.breakdown.multiplier < 1 });

    recordBasketballRound({
      mode: "timeAttack",
      soundId,
      difficulty,
      basketballScore: finalScore,
      basketsMade: finalTally.made,
      shotsTaken: finalTally.shots,
      bestStreak: finalTally.bestStreak,
      coinsEarned: earned.coins,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handlePlayAgain = useCallback(() => {
    if (returnTimerRef.current !== null)
      window.clearTimeout(returnTimerRef.current);
    if (streakTimerRef.current !== null)
      window.clearTimeout(streakTimerRef.current);
    pool.forEach((ball) => {
      ball.active = false;
      ball.counted = true;
    });
    recordedRef.current = false;
    tallyRef.current = { ...EMPTY_TALLY };
    publishTally();
    setStreakLabel(null);
    setSecondsRemaining(TIME_ATTACK_SECONDS);
    setBallReady(false);
    setReward({ coins: 0, reduced: false });
    setSnapshot({
      previousBest: getModeRecord(basketball, "timeAttack", soundId, difficulty)
        .bestScore,
      playsToday: getPlaysToday(basketball, "timeAttack"),
    });
    setRunId((value) => value + 1);
    setPhase("gate");
  }, [basketball, soundId, difficulty, pool, publishTally]);

  if (!level || !gateTarget) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#141420] p-6 text-center text-white">
        <div>
          <p className="text-xl font-black">
            This sound isn&apos;t ready for Time Attack yet.
          </p>
          <button
            type="button"
            onClick={onExit}
            className="mt-4 rounded-2xl bg-[#f5c33b] px-6 py-3 font-black text-[#141420]"
          >
            Back to TalkWise Play
          </button>
        </div>
      </div>
    );
  }

  const currentBest = Math.max(snapshot.previousBest, summary.score);

  return (
    <div className="relative h-[100dvh] w-full touch-none overflow-hidden overscroll-none bg-[#8fd8f5] select-none [-webkit-touch-callout:none] [-webkit-user-select:none]">
      <div className="absolute inset-0">
        <ArcadeScene
          pool={pool}
          ballerId={basketball.loadout.ballerId}
          jerseyId={basketball.loadout.jerseyId}
          ballReady={ballReady}
          secondsRemaining={secondsRemaining}
          onBallEvent={handleBallEvent}
        />
      </div>

      {/* The drag surface. Covers the whole viewport so a flick can start
          anywhere — asking a child to hit a small ball target first would
          make the mode about accuracy of tapping rather than shooting. */}
      <div
        ref={surfaceRef}
        className="absolute inset-0 z-[5] touch-none"
        onPointerDown={handlePointerDown}
        onPointerUp={releaseDrag}
        onPointerCancel={handlePointerCancel}
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0">
        {phase !== "gate" && phase !== "results" ? (
          <TimeAttackHud
            secondsRemaining={secondsRemaining}
            score={tally.score}
            streak={tally.streak}
            // Quitting mid-round returns to Basketball's own home, matching
            // Shootout — leaving the platform entirely is a results-screen
            // choice, not something a mis-tap should do.
            onExit={onBackToBasketball}
          />
        ) : null}

        {phase === "playing" && streakLabel ? (
          <StreakBanner label={streakLabel} />
        ) : null}

        {phase === "playing" && tally.shots === 0 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-6">
            <p className="rounded-2xl bg-white/90 px-4 py-2 text-center text-sm font-black text-[#141420] shadow">
              Drag up toward the hoop and let go! 🏀
            </p>
          </div>
        ) : null}

        {phase === "countdown" ? (
          <ArcadeCountdown value={countdownValue} />
        ) : null}

        {phase === "gate" ? (
          <SpeechGate
            key={`gate-${runId}`}
            target={gateTarget}
            headline="Say It To Start"
            micEnabled={profile.micEnabled}
            assist={profile.assistMode}
            onMicEnabledChange={setMicEnabled}
            onUnlock={handleUnlock}
          />
        ) : null}

        {phase === "results" ? (
          <TimeAttackResults
            summary={summary}
            coinsEarned={reward.coins}
            personalBest={currentBest}
            isNewBest={summary.score > snapshot.previousBest}
            reducedReward={reward.reduced}
            onPlayAgain={handlePlayAgain}
            onChangeSound={onChangeSound}
            onChangeDifficulty={onChangeDifficulty}
            onBackToBasketball={onBackToBasketball}
            onExit={onExit}
          />
        ) : null}
      </div>
    </div>
  );
}
