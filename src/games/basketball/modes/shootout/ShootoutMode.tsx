"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listLevels } from "@/content/speech";
import {
  requestSpeechTargets,
  type SpeechDifficulty,
} from "@/content/speech/engine";
import { getDifficulty, SHOTS_PER_ROUND } from "@/content/basketball/types";
import { GAME_BASKETBALL } from "@/platform/games/registry";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { hoopAudio } from "../../core/audio";
import {
  buildRoundPlan,
  computeCurrentStreak,
  resolveShot,
  summarizeRound,
  type ShotResult,
  type TimingTier,
} from "../../core/round";
import type { BallFlight } from "../../scene/Ball";
import { CourtScene } from "../../scene/CourtScene";
import type { ShotPhase } from "../../scene/BallerAvatar";
import { RoundHud } from "../../ui/RoundHud";
import { RoundResults } from "../../ui/RoundResults";
import { ShotMeter } from "../../ui/ShotMeter";
import { SpeechGate } from "../../ui/SpeechGate";

type Phase = "ready" | "word" | "meter" | "shooting" | "banner" | "results";

const RIM_POSITION: [number, number, number] = [0, 2.55, 0.04];
const RESULT_BANNER_MS = 1300;

function missTarget(): [number, number, number] {
  return [(Math.random() - 0.5) * 0.9, 2.75 + Math.random() * 0.3, -0.05];
}

/**
 * MODE 01 — Speech Shootout.
 *
 * The original, production-verified quick-play loop, unchanged in substance:
 * say the target → the shot unlocks → time the meter → the ball flies → next
 * target, ten times. The shot-meter make-chances in `core/round.ts` are the
 * founder-verified ones and are deliberately not touched here.
 *
 * What the expansion changed: targets now come from the shared content engine
 * at a chosen speech difficulty rather than straight off the level, and the
 * speech popup is the shared `SpeechGate` rather than a Shootout-private
 * component. At Intermediate — the difficulty every existing save was
 * effectively playing — both are substitutions of identical behaviour.
 */
export function ShootoutMode({
  soundId,
  difficulty,
  onExit,
  onChangeSound,
  onChangeDifficulty,
}: {
  soundId: string;
  difficulty: SpeechDifficulty;
  onExit: () => void;
  onChangeSound: () => void;
  onChangeDifficulty: () => void;
}) {
  const level = useMemo(
    () => listLevels().find((l) => l.sound.id === soundId),
    [soundId],
  );
  const meterDifficulty = getDifficulty("rookie");

  const plan = useMemo(() => {
    const targets = requestSpeechTargets({
      gameId: GAME_BASKETBALL,
      mode: "shootout",
      soundId,
      difficulty,
      targetCount: SHOTS_PER_ROUND,
    });
    return buildRoundPlan(targets);
  }, [soundId, difficulty]);

  // `basketball` is GAME-002's own isolated slice of this child's data —
  // ballers, jerseys and records. Nothing here can read or write the
  // Adventures wardrobe.
  const { profile, basketball, recordBasketballRound, setMicEnabled } =
    usePlayerProfile();

  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<Phase>("word");
  const [shotIndex, setShotIndex] = useState(0);
  const [results, setResults] = useState<ShotResult[]>([]);
  const [avatarPhase, setAvatarPhase] = useState<ShotPhase>("idle");
  const [ballFlight, setBallFlight] = useState<BallFlight | null>(null);
  const [lastResult, setLastResult] = useState<ShotResult | null>(null);
  const recordedRef = useRef(false);
  // Captured once per round, before it can be overwritten by this round's
  // own recorded score — `profile` is reactive, so reading it directly at
  // results time would already reflect the round that just finished.
  const [previousBest, setPreviousBest] = useState(
    () => basketball.highScores[soundId]?.bestScore ?? 0,
  );

  useEffect(() => {
    hoopAudio.unlock();
    hoopAudio.startMusic();
  }, [runId]);

  // Background music runs for the whole time this mode is mounted, not just
  // per-round — stop it once, on the way out, rather than restarting it every
  // "Play Again".
  useEffect(() => {
    return () => hoopAudio.stopMusic();
  }, []);

  const currentPlan = plan[shotIndex];
  const currentStreak = computeCurrentStreak(results);

  const handleUnlock = useCallback(() => {
    setAvatarPhase("aiming");
    setPhase("meter");
  }, []);

  const handleShotLock = useCallback(
    (timing: TimingTier) => {
      if (!currentPlan) return;
      const result = resolveShot(currentPlan, timing);
      const spotX = Math.sin(currentPlan.spot.angle) * currentPlan.spot.distance;
      const spotZ = Math.cos(currentPlan.spot.angle) * currentPlan.spot.distance;

      hoopAudio.release();
      setAvatarPhase("releasing");
      setLastResult(result);
      setBallFlight({
        from: [spotX, 1.55, spotZ],
        to: result.made ? RIM_POSITION : missTarget(),
        startedAt: Date.now(),
        durationMs: 650 + currentPlan.spot.distance * 40,
        peakHeight: 1.3 + currentPlan.spot.distance * 0.15,
      });
      setPhase("shooting");
    },
    [currentPlan],
  );

  const handleBallArrive = useCallback(() => {
    if (!lastResult) return;
    setBallFlight(null);
    setAvatarPhase(lastResult.made ? "made" : "missed");
    if (lastResult.made) {
      hoopAudio.swish();
      hoopAudio.cheer();
    } else {
      hoopAudio.clank();
    }

    setResults((current) => {
      const next = [...current, lastResult];
      const streak = computeCurrentStreak(next);
      if (streak === 3 || streak === 5) {
        window.setTimeout(() => {
          hoopAudio.streak();
        }, 300);
      }
      return next;
    });
    setPhase("banner");

    window.setTimeout(() => {
      setAvatarPhase("idle");
      if (shotIndex + 1 >= SHOTS_PER_ROUND) {
        setPhase("results");
      } else {
        setShotIndex((i) => i + 1);
        // Not straight to "word": the baller and camera are moving to the
        // next spot right now, and the speech popup used to cover that move
        // completely. "ready" holds off the popup until the child taps
        // SHOOT, so the move to the next basket is actually visible.
        setPhase("ready");
      }
    }, RESULT_BANNER_MS);
  }, [lastResult, shotIndex]);

  const handleReadyShoot = useCallback(() => {
    setPhase("word");
  }, []);

  const summary = useMemo(() => summarizeRound(results), [results]);

  useEffect(() => {
    if (phase !== "results" || recordedRef.current) return;
    recordedRef.current = true;
    hoopAudio.buzzer();
    recordBasketballRound({
      mode: "shootout",
      soundId,
      difficulty,
      basketballScore: summary.basketballScore,
      basketsMade: summary.basketsMade,
      shotsTaken: SHOTS_PER_ROUND,
      bestStreak: summary.bestStreak,
      coinsEarned: summary.coinsEarned,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handlePlayAgain = useCallback(() => {
    recordedRef.current = false;
    setPreviousBest(basketball.highScores[soundId]?.bestScore ?? 0);
    setResults([]);
    setShotIndex(0);
    setLastResult(null);
    setBallFlight(null);
    setAvatarPhase("idle");
    setPhase("word");
    setRunId((r) => r + 1);
  }, [basketball.highScores, soundId]);

  if (!level || plan.length === 0) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#141420] p-6 text-center text-white">
        <div>
          <p className="text-xl font-black">
            This sound isn&apos;t ready for Speech Basketball yet.
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

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden overscroll-none bg-[#8fd8f5] select-none">
      <div className="absolute inset-0">
        <CourtScene
          spot={currentPlan.spot}
          ballerId={basketball.loadout.ballerId}
          jerseyId={basketball.loadout.jerseyId}
          phase={avatarPhase}
          ballFlight={ballFlight}
          onBallArrive={handleBallArrive}
        />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <RoundHud
          shotNumber={Math.min(shotIndex + 1, SHOTS_PER_ROUND)}
          totalShots={SHOTS_PER_ROUND}
          basketballScore={summary.basketballScore}
          coinsEarned={summary.coinsEarned}
          streak={currentStreak}
          spotLabel={currentPlan.spot.label}
          onExit={onExit}
        />

        {phase === "ready" ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center px-4">
            <button
              type="button"
              onClick={handleReadyShoot}
              className="tw-pop pointer-events-auto rounded-full border-b-8 border-[#1c5fc9] bg-[#2f80ff] px-10 py-4 text-xl font-black tracking-wide text-white shadow-2xl transition-transform active:translate-y-1 active:border-b-4"
            >
              🏀 SHOOT
            </button>
          </div>
        ) : null}

        {phase === "word" ? (
          <SpeechGate
            key={`word-${shotIndex}-${runId}`}
            target={currentPlan.target}
            headline="Say It To Shoot"
            micEnabled={profile.micEnabled}
            assist={profile.assistMode}
            onMicEnabledChange={setMicEnabled}
            onUnlock={handleUnlock}
          />
        ) : null}

        {phase === "meter" ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center px-4">
            <ShotMeter difficulty={meterDifficulty} onLock={handleShotLock} />
          </div>
        ) : null}

        {phase === "banner" && lastResult ? (
          <div className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center px-4">
            <div
              className={`tw-pop rounded-3xl border-8 px-8 py-5 text-center shadow-2xl ${
                lastResult.made
                  ? "border-[#2ecc71] bg-white"
                  : "border-[#ff8a3d] bg-white"
              }`}
            >
              <p
                className={`text-3xl font-black ${
                  lastResult.made ? "text-[#2ecc71]" : "text-[#ff8a3d]"
                }`}
              >
                {lastResult.made ? "SWISH!" : "SO CLOSE!"}
              </p>
              <p className="mt-1 text-lg font-extrabold text-[#141420]">
                {lastResult.made ? `+${lastResult.pointsEarned} ⭐  ` : ""}+
                {lastResult.coinsEarned} coins
              </p>
            </div>
          </div>
        ) : null}

        {phase === "results" ? (
          <RoundResults
            summary={summary}
            totalShots={SHOTS_PER_ROUND}
            isNewBest={summary.basketballScore > previousBest}
            previousBest={previousBest}
            onPlayAgain={handlePlayAgain}
            onChangeSound={onChangeSound}
            onChangeDifficulty={onChangeDifficulty}
            onExit={onExit}
          />
        ) : null}
      </div>
    </div>
  );
}
