"use client";

/**
 * GAME-003 BUBBLE BLAST — the reference mini-game.
 *
 * Phase 2 of the build plan, and deliberately the first one built: every
 * framework service is exercised here before any of it is relied on five
 * more times. Speech gate, countdown, session scoring, combos, power-ups,
 * particles, touch safety, coins, personal bests and the results screen all
 * appear in this one file's ~200 lines of game code — and none of that logic
 * is *in* this file, which is what proves the framework carries its weight.
 *
 * ## The loop
 *
 * ```
 *   plan a round  →  speech gate  →  3·2·1·GO  →  30 seconds of bubbles
 *                                                     →  results  →  replay
 * ```
 *
 * The speech gate runs once, before the clock (§7: "player attempts target,
 * THEN bubble blast"). Putting a microphone in front of every pop would
 * make a thirty-second arcade round take four minutes and would be the
 * opposite of what a mini-game is for.
 *
 * ## Correct, wrong, and the absence of punishment
 *
 * A target bubble pops with particles, a rising tone and a combo step. A
 * distractor pops with a soft blip and a gentle nudge, breaks the combo,
 * and costs nothing else — no points deducted, no time lost, no "WRONG"
 * (§7, §17). Both are *satisfying to pop*, because a child who cannot pop
 * the wrong ones learns nothing about which are right.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { dailySeed } from "@/content/minigames";
import type {
  ContentPackId,
  MiniLearningLevel,
} from "@/content/minigames/types";
import { miniAudio } from "@/minigames/audio";
import { getMiniGame } from "@/minigames/registry";
import { speechTargetWithFallback } from "@/minigames/speech";
import { useGestureLock } from "@/minigames/touch";
import { useCountdown } from "@/minigames/useCountdown";
import { useMiniGameRun } from "@/minigames/useMiniGameRun";
import { CountdownOverlay } from "@/minigames/ui/CountdownOverlay";
import { MayaCoach, speakerFor } from "@/minigames/ui/MayaCoach";
import { MiniGameHud } from "@/minigames/ui/MiniGameHud";
import { MiniGameResults } from "@/minigames/ui/MiniGameResults";
import { MiniSpeechGate } from "@/minigames/ui/MiniSpeechGate";
import { ParticleLayer, useParticles } from "@/minigames/ui/Particles";
import { PowerUpBadge } from "@/minigames/ui/PowerUpBadge";
import { GAME_BUBBLE_BLAST, getGame } from "@/platform/games/registry";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { BubbleView } from "./Bubble";
import {
  MAX_BUBBLES,
  ROUND_MS,
  SPAWN_INTERVAL_MS,
  planRound,
  pruneBubbles,
  spawnBubble,
  type Bubble,
} from "./core/field";
import { createRng } from "@/content/minigames";

type Stage = "gate" | "countdown" | "playing";

export function BubbleBlastGame({
  packId,
  level,
}: {
  packId: ContentPackId;
  level: MiniLearningLevel;
}) {
  const router = useRouter();
  const game = getGame(GAME_BUBBLE_BLAST);
  const definition = getMiniGame(GAME_BUBBLE_BLAST);
  const { profile, setMicEnabled } = usePlayerProfile();

  const run = useMiniGameRun({
    gameId: GAME_BUBBLE_BLAST,
    definition,
    packId,
    level,
  });
  const particles = useParticles();
  useGestureLock(true);

  const [stage, setStage] = useState<Stage>("gate");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [popped, setPopped] = useState<number[]>([]);
  const [nudge, setNudge] = useState(false);
  // Bumped on replay so a new round gets a new seed — §15's "randomised
  // target order" has to actually change between rounds to mean anything.
  const [roundIndex, setRoundIndex] = useState(0);

  const keyRef = useRef(0);
  const rngRef = useRef<(() => number) | null>(null);

  const plan = useMemo(
    () => planRound({ packId, level, seed: dailySeed() + roundIndex * 977 }),
    [packId, level, roundIndex],
  );

  const speechTarget = useMemo(() => {
    if (!plan?.config.targetItem) return null;
    return speechTargetWithFallback(plan.config.targetItem, level);
  }, [plan, level]);

  const clock = useCountdown({
    durationMs: ROUND_MS,
    onExpire: () => run.finish({ completed: true }),
  });

  // --- Bubble spawning ----------------------------------------------------

  useEffect(() => {
    if (stage !== "playing" || !plan) return;
    const rng = rngRef.current ?? createRng(dailySeed() + roundIndex * 977 + 13);
    rngRef.current = rng;

    const timer = window.setInterval(() => {
      const now = Date.now();
      setBubbles((current) => {
        const alive = pruneBubbles(current, now);
        if (alive.length >= MAX_BUBBLES) return alive;
        keyRef.current += 1;
        return [...alive, spawnBubble(plan, keyRef.current, rng, now)];
      });
    }, SPAWN_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [stage, plan, roundIndex]);

  // --- Popping -------------------------------------------------------------

  const handlePop = useCallback(
    (bubble: Bubble, xPercent: number, yPercent: number) => {
      setPopped((current) => [...current, bubble.key]);
      // Retire the popped bubble shortly after its pop animation, so the
      // list never grows unbounded across a thirty-second round.
      window.setTimeout(() => {
        setBubbles((current) => current.filter((entry) => entry.key !== bubble.key));
        setPopped((current) => current.filter((key) => key !== bubble.key));
      }, 300);

      if (bubble.isTarget) {
        miniAudio.pop();
        run.session.correct();
        particles.burst(xPercent, yPercent, "✨", "#f5c33b");
      } else {
        // Gentle, neutral, and over in a quarter of a second.
        run.session.wrong();
        setNudge(true);
        window.setTimeout(() => setNudge(false), 260);
      }
    },
    [run.session, particles],
  );

  // --- Stage transitions ---------------------------------------------------

  const handleUnlock = useCallback(
    (spoke: boolean) => {
      if (spoke) run.markSpoke();
      setStage("countdown");
    },
    [run],
  );

  const handleCountdownDone = useCallback(() => {
    setStage("playing");
    run.begin();
    clock.start();
  }, [run, clock]);

  const handleExit = useCallback(() => {
    clock.stop();
    run.finish({ completed: false });
  }, [clock, run]);

  const handleReplay = useCallback(() => {
    clock.stop();
    setBubbles([]);
    setPopped([]);
    rngRef.current = null;
    setRoundIndex((index) => index + 1);
    setStage("gate");
    run.replay();
  }, [clock, run]);

  // A pack with too little content for this level cannot run. Say so plainly
  // and offer the way back, rather than showing an empty field.
  if (!plan) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-[#8fd8f5] to-[#eaf8e6] p-6">
        <div className="max-w-sm rounded-[1.75rem] border-8 border-[#f5c33b] bg-white p-6 text-center shadow-2xl">
          <p className="text-2xl font-black text-[#141420]">
            This pack is not ready for that level yet.
          </p>
          <button
            type="button"
            onClick={() => router.push(game.route)}
            className="mt-4 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-4 py-4 text-xl font-black text-white"
          >
            Pick another
          </button>
        </div>
      </main>
    );
  }

  const showResults = run.phase === "results";

  return (
    <main className="relative flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-b from-[#0d2f52] via-[#1c5f96] to-[#4fb3d9]">
      <MiniGameHud
        score={run.session.state.score}
        combo={run.session.state.combo}
        multiplier={
          run.session.state.combo > 0
            ? run.session.multiplier
            : 1
        }
        secondsRemaining={stage === "playing" ? clock.secondsRemaining : undefined}
        coins={spendableCoins(profile)}
        onExit={handleExit}
      />

      {/* The prompt band. Always visible while playing, because a child who
          looks up mid-round must be able to remember what they are hunting
          without a menu. */}
      {stage === "playing" ? (
        <div className="relative z-20 px-3 py-2">
          <p className="mx-auto max-w-md rounded-full border-4 border-white/70 bg-white/90 px-4 py-2 text-center text-lg font-black text-[#141420] shadow-lg">
            {plan.prompt}
          </p>
        </div>
      ) : null}

      {/* The field. `data-bubble-field` is how a bubble finds its stage to
          report a pop position against. */}
      <div
        data-bubble-field
        className={`relative flex-1 overflow-hidden ${nudge ? "tw-nudge" : ""}`}
      >
        {/* Underwater light, drawn rather than shipped as an image. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            background:
              "radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,0.55), transparent 60%)",
          }}
        />

        {stage === "playing"
          ? bubbles.map((bubble) => (
              <BubbleView
                key={bubble.key}
                bubble={bubble}
                popped={popped.includes(bubble.key)}
                onPop={handlePop}
              />
            ))
          : null}

        <ParticleLayer bursts={particles.bursts} />
        <PowerUpBadge active={run.powerUps.active} />

        {stage === "gate" && speechTarget ? (
          <MiniSpeechGate
            key={speechTarget.id}
            target={speechTarget}
            headline="Say it to start"
            micEnabled={profile.micEnabled}
            assist={profile.assistMode}
            onMicEnabledChange={setMicEnabled}
            onUnlock={handleUnlock}
          />
        ) : null}

        {/* A pack with no speakable target still has a playable round —
            the field does not depend on the microphone. */}
        {stage === "gate" && !speechTarget ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#141420]/70 p-4">
            <div className="tw-pop w-full max-w-sm rounded-[2rem] border-8 border-[#f5c33b] bg-white p-5 text-center">
              <MayaCoach line={plan.prompt} speak={speakerFor(speechTarget)} />
              <button
                type="button"
                onClick={() => handleUnlock(false)}
                className="mt-4 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-2xl font-black text-white"
              >
                START
              </button>
            </div>
          </div>
        ) : null}

        {stage === "countdown" ? (
          <CountdownOverlay onDone={handleCountdownDone} />
        ) : null}

        {showResults && run.summary && run.reward ? (
          <MiniGameResults
            title="Bubble Blast"
            summary={run.summary}
            reward={run.reward}
            wasPersonalBest={run.wasPersonalBest}
            bestScore={run.bestScore}
            powerUpsEarned={run.powerUps.earnedCount}
            onReplay={handleReplay}
            setupHref={game.route}
            highlight={
              run.summary.correct > 0
                ? `You popped ${run.summary.correct} bubbles!`
                : undefined
            }
          />
        ) : null}
      </div>
    </main>
  );
}
