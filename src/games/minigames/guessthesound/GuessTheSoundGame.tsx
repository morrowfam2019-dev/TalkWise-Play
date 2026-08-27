"use client";

/**
 * GAME-006 GUESS THE SOUND — listen, then choose.
 *
 * ## Every sound here is synthesised, and that is a product decision
 *
 * §28's acceptance test says "no copyrighted sounds used". This game meets
 * it by construction: the sounds are generated in the browser from
 * oscillators and shaped noise, described as data in
 * `content/minigames/listen.ts` and played by the shared audio engine.
 * There is no sample in this game that could have needed a licence — and a
 * themed set of recorded animal noises would also have been megabytes,
 * which is not what §14 means by a mini-game.
 *
 * ## Replay is a first-class button, not a hidden one
 *
 * A listening game whose sound you can only hear once is a memory test. The
 * replay button is the largest control on the screen after the choices, and
 * it stays available for the whole round — including after a wrong guess,
 * which is exactly when a child needs to hear it again.
 *
 * It is rate-limited to the sound's own length so a child mashing it hears
 * one clean sound rather than six overlapping copies of it.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { dailySeed } from "@/content/minigames";
import {
  getListenRecipe,
  listenRecipeDurationMs,
} from "@/content/minigames/listen";
import type {
  ContentPackId,
  MiniLearningLevel,
} from "@/content/minigames/types";
import { miniAudio } from "@/minigames/audio";
import { getMiniGame } from "@/minigames/registry";
import { speechTargetWithFallback } from "@/minigames/speech";
import { useGestureLock, useIntentionalTap } from "@/minigames/touch";
import { useMiniGameRun } from "@/minigames/useMiniGameRun";
import { MayaCoach, speakerFor } from "@/minigames/ui/MayaCoach";
import { MiniGameHud } from "@/minigames/ui/MiniGameHud";
import { MiniGameResults } from "@/minigames/ui/MiniGameResults";
import { MiniSpeechGate } from "@/minigames/ui/MiniSpeechGate";
import { ParticleLayer, useParticles } from "@/minigames/ui/Particles";
import { GAME_GUESS_THE_SOUND, getGame } from "@/platform/games/registry";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { planSounds, type SoundChoice } from "./core/rounds";

/** Which rounds offer the speech moment. Same strategic spacing as the
 * hunt: three real speech turns rather than a microphone on every guess. */
const SPEECH_ON_ROUNDS = [0, 3, 6];

type Stage = "listening" | "revealed" | "speaking";

function ChoiceCard({
  choice,
  state,
  disabled,
  onPick,
}: {
  choice: SoundChoice;
  state: "idle" | "right" | "wrong";
  disabled: boolean;
  onPick: (choice: SoundChoice) => void;
}) {
  const [pressed, setPressed] = useState(false);
  const handlers = useIntentionalTap(
    () => {
      setPressed(false);
      onPick(choice);
    },
    { disabled, onArm: () => setPressed(true) },
  );

  return (
    <button
      type="button"
      id={`sound-choice-${choice.id.replace(/[^a-z0-9]/gi, "-")}`}
      aria-label={choice.item.word}
      disabled={disabled}
      {...handlers}
      onPointerLeave={() => {
        setPressed(false);
        handlers.onPointerLeave();
      }}
      onPointerCancel={() => {
        setPressed(false);
        handlers.onPointerCancel();
      }}
      className={`flex touch-none flex-col items-center justify-center rounded-[1.5rem] border-8 bg-white p-4 shadow-xl transition-transform ${
        state === "right"
          ? "tw-found border-[#2ecc71]"
          : state === "wrong"
            ? "tw-nudge border-[#c9d4de] opacity-60"
            : "border-white"
      } ${pressed && state === "idle" ? "scale-95" : ""}`}
    >
      <span className="text-5xl leading-none sm:text-6xl" aria-hidden>
        {choice.item.glyph}
      </span>
      <span className="mt-1 text-sm font-black text-[#141420] uppercase">
        {choice.item.word}
      </span>
    </button>
  );
}

export function GuessTheSoundGame({
  packId,
  level,
}: {
  packId: ContentPackId;
  level: MiniLearningLevel;
}) {
  const router = useRouter();
  const game = getGame(GAME_GUESS_THE_SOUND);
  const definition = getMiniGame(GAME_GUESS_THE_SOUND);
  const { profile, setMicEnabled } = usePlayerProfile();

  const run = useMiniGameRun({
    gameId: GAME_GUESS_THE_SOUND,
    definition,
    packId,
    level,
  });
  const particles = useParticles();
  useGestureLock(true);

  const [sessionIndex, setSessionIndex] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("listening");
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [playing, setPlaying] = useState(false);
  const startedRef = useRef(false);
  const replayLockRef = useRef(0);

  const rounds = useMemo(
    () => planSounds({ packId, level, seed: dailySeed() + sessionIndex * 733 }),
    [packId, level, sessionIndex],
  );
  const round = rounds?.[roundIndex] ?? null;

  const speechTarget = useMemo(
    () => (round ? speechTargetWithFallback(round.target, level) : null),
    [round, level],
  );

  /**
   * Plays the round's sound.
   *
   * Rate-limited to the recipe's own duration: a child mashing the replay
   * button should hear one clean sound rather than six overlapping copies,
   * which would make the round *harder* the more help they asked for.
   */
  const playSound = useCallback(() => {
    if (!round?.target.listen) return;
    const now = Date.now();
    if (now < replayLockRef.current) return;

    miniAudio.unlock();
    const durationMs = miniAudio.playListen(round.target.listen);
    replayLockRef.current = now + Math.max(400, durationMs);
    setPlaying(true);
    window.setTimeout(() => setPlaying(false), Math.max(400, durationMs));
  }, [round]);

  // Start the session, and play the first sound, once the plan is ready.
  const begin = run.begin;
  useEffect(() => {
    if (!rounds || startedRef.current) return;
    startedRef.current = true;
    begin();
  }, [rounds, begin]);

  // A new round announces itself: the sound plays without being asked for.
  useEffect(() => {
    if (stage !== "listening" || !round) return;
    const timer = window.setTimeout(() => playSound(), 450);
    return () => window.clearTimeout(timer);
    // Intentionally keyed on the round rather than on `playSound`, so the
    // sound plays once per round and not again on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex, stage, sessionIndex]);

  const advance = useCallback(() => {
    if (!rounds) return;
    setWrongIds([]);
    if (roundIndex + 1 >= rounds.length) {
      run.finish({ completed: true });
      return;
    }
    setRoundIndex((index) => index + 1);
    setStage("listening");
  }, [rounds, roundIndex, run]);

  const handlePick = useCallback(
    (choice: SoundChoice) => {
      if (!round || stage !== "listening") return;

      if (!choice.isTarget) {
        // Wrong one dims and steps back. The sound is still there to replay,
        // and there is no penalty beyond the broken combo.
        run.session.wrong();
        setWrongIds((current) => [...current, choice.id]);
        return;
      }

      run.session.correct();
      particles.burst(50, 62, "🎉", "#2ecc71");
      setStage("revealed");

      if (SPEECH_ON_ROUNDS.includes(roundIndex)) {
        window.setTimeout(() => setStage("speaking"), 1500);
      } else {
        window.setTimeout(advance, 1700);
      }
    },
    [round, stage, run.session, particles, roundIndex, advance],
  );

  const handleUnlock = useCallback(
    (spoke: boolean) => {
      if (spoke) run.markSpoke();
      advance();
    },
    [run, advance],
  );

  const handleExit = useCallback(() => run.finish({ completed: false }), [run]);

  const handleReplay = useCallback(() => {
    startedRef.current = false;
    setRoundIndex(0);
    setWrongIds([]);
    setStage("listening");
    setSessionIndex((index) => index + 1);
    run.replay();
  }, [run]);

  if (!rounds || !round) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-[#d6f7ec] to-[#7fd6c4] p-6">
        <div className="max-w-sm rounded-[1.75rem] border-8 border-[#f5c33b] bg-white p-6 text-center shadow-2xl">
          <p className="text-2xl font-black text-[#141420]">
            This pack has no sounds for that level yet.
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

  const recipe = round.target.listen
    ? getListenRecipe(round.target.listen)
    : null;
  const soundMs = recipe ? listenRecipeDurationMs(recipe) : 0;

  return (
    <main className="relative flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-b from-[#0e3b39] via-[#1f6f66] to-[#7fd6c4]">
      <MiniGameHud
        score={run.session.state.score}
        combo={run.session.state.combo}
        multiplier={run.session.state.combo > 0 ? run.session.multiplier : 1}
        roundLabel={`${roundIndex + 1} of ${rounds.length}`}
        coins={spendableCoins(profile)}
        onExit={handleExit}
      />

      <div className="relative flex flex-1 flex-col overflow-hidden px-4 py-3">
        {/* The mystery stage. The big button IS the sound — pressing it is
            how a child asks to hear it again, and it is the largest thing
            on screen for exactly that reason. */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-center text-lg font-black text-white/90">
            {round.prompt}
          </p>

          <button
            type="button"
            onClick={playSound}
            aria-label="Play the sound again"
            className={`mt-3 flex h-36 w-36 flex-col items-center justify-center rounded-full border-8 border-white bg-gradient-to-br from-[#8fe3c4] to-[#2f9e8c] shadow-2xl transition-transform active:scale-95 sm:h-44 sm:w-44 ${
              playing ? "scale-105" : ""
            }`}
          >
            <span className="text-5xl drop-shadow" aria-hidden>
              {playing ? "🔊" : "🔈"}
            </span>
            <span className="mt-1 text-xs font-black tracking-widest text-white uppercase">
              {playing ? "Listen!" : "Play again"}
            </span>
          </button>

          {playing ? (
            <div
              className="mt-3 flex h-6 items-end justify-center gap-1"
              aria-hidden
            >
              {[0, 1, 2, 3, 4].map((bar) => (
                <span
                  key={bar}
                  className="tw-wave w-1.5 rounded-full bg-white/80"
                  style={{ animationDelay: `${bar * 90}ms` }}
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 h-6 text-xs font-bold text-white/60">
              Tap to hear it again ({Math.max(1, Math.round(soundMs / 1000))}s)
            </p>
          )}

          {stage === "revealed" || stage === "speaking" ? (
            <p className="tw-pop mt-2 text-3xl font-black text-[#f5c33b] drop-shadow">
              {round.onomatopoeia}
            </p>
          ) : null}
        </div>

        {/* The choices. */}
        <div
          className={`mx-auto grid w-full max-w-md gap-3 pb-2 ${
            round.choices.length > 3 ? "grid-cols-2" : "grid-cols-3"
          }`}
        >
          {round.choices.map((choice) => (
            <ChoiceCard
              key={choice.id}
              choice={choice}
              state={
                (stage === "revealed" || stage === "speaking") &&
                choice.isTarget
                  ? "right"
                  : wrongIds.includes(choice.id)
                    ? "wrong"
                    : "idle"
              }
              disabled={stage !== "listening" || wrongIds.includes(choice.id)}
              onPick={handlePick}
            />
          ))}
        </div>

        <ParticleLayer bursts={particles.bursts} />

        {stage === "revealed" && run.phase === "playing" ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-40 z-30 flex justify-center px-4">
            <div className="tw-pop w-full max-w-md">
              <MayaCoach
                line={round.reveal}
                speak={speakerFor(speechTarget)}
                tone="praise"
              />
            </div>
          </div>
        ) : null}

        {stage === "speaking" && speechTarget && run.phase === "playing" ? (
          <MiniSpeechGate
            key={`${roundIndex}-${speechTarget.id}`}
            target={speechTarget}
            headline="You got it! Now say it"
            micEnabled={profile.micEnabled}
            assist={profile.assistMode}
            onMicEnabledChange={setMicEnabled}
            onUnlock={handleUnlock}
            onSkip={() => handleUnlock(false)}
          />
        ) : null}

        {run.phase === "results" && run.summary && run.reward ? (
          <MiniGameResults
            title="Guess the Sound"
            summary={run.summary}
            reward={run.reward}
            wasPersonalBest={run.wasPersonalBest}
            bestScore={run.bestScore}
            powerUpsEarned={run.powerUps.earnedCount}
            onReplay={handleReplay}
            setupHref={game.route}
            highlight={
              run.summary.correct > 0
                ? `You guessed ${run.summary.correct} sounds!`
                : undefined
            }
          />
        ) : null}
      </div>
    </main>
  );
}
