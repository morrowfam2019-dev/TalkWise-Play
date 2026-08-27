"use client";

/**
 * GAME-007 ACTION DASH — say it, and TJ does it.
 *
 * The one game in the collection where the speech is not beside the
 * gameplay but *is* the gameplay. A child identifies the action, then says
 * it, and the saying is what makes TJ perform it on his course. §7's brief
 * in one sentence: the speech creates the action.
 *
 * ## The course is 3D, and TJ actually travels
 *
 * The first version stood a flat cartoon still in the middle of a large
 * empty gradient: a game called *Dash* with no dashing in it, and two
 * thirds of a phone screen given to sky. It is now a side-on 3D course —
 * TJ runs on the spot at a fixed point on screen while the world slides
 * past him, which reads as him dashing **left** to the next command.
 *
 * §29's acceptance test says Action Dash must have no GAME-001 engine
 * dependency, and it still has none: `scene/` here is its own small R3F
 * scene, sharing nothing with the adventure engine's world, controller or
 * collision. §31 says not to build 3D where 2D performs better on mobile —
 * that holds for a static character, and stops holding the moment the
 * character has to travel through a scene and perform ten different
 * actions. TJ is built from primitives, so he weighs nothing to download
 * and every verb is a few numbers in the frame loop.
 *
 * ## The speech moment cannot be a wall
 *
 * TJ performs whether or not the recogniser heard anything: the gate's
 * "I SAID IT" is on screen from the first second and the third attempt
 * always opens it. A child who is not producing the word clearly yet still
 * gets to watch their character run, which is the whole reward and exactly
 * the population this game is for.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { dailySeed } from "@/content/minigames";
import { getAction } from "@/content/minigames/attributes";
import type {
  ContentPackId,
  MiniLearningLevel,
} from "@/content/minigames/types";
import { splitTargetWords } from "@/content/speech/engine";
import { miniAudio } from "@/minigames/audio";
import { getMiniGame } from "@/minigames/registry";
import type { MiniSpeechTarget } from "@/minigames/speech";
import { useGestureLock, useIntentionalTap } from "@/minigames/touch";
import { useMiniGameRun } from "@/minigames/useMiniGameRun";
import { MayaCoach, speakerFor } from "@/minigames/ui/MayaCoach";
import { MiniGameHud } from "@/minigames/ui/MiniGameHud";
import { MiniGameResults } from "@/minigames/ui/MiniGameResults";
import { MiniSpeechGate } from "@/minigames/ui/MiniSpeechGate";
import { ParticleLayer, useParticles } from "@/minigames/ui/Particles";
import { PowerUpBadge } from "@/minigames/ui/PowerUpBadge";
import { DashScene } from "./scene/DashScene";
import type { TJPose } from "./scene/TJModel";
import { GAME_ACTION_DASH, getGame } from "@/platform/games/registry";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { planActions, type ActionChoice } from "./core/rounds";

/** How long TJ performs the action before he sets off again. */
const PERFORM_MS = 2100;

/** How long he dashes to the next command. Long enough to read as travel,
 * short enough that it never becomes a wait. */
const DASH_MS = 1400;

type Stage = "choosing" | "speaking" | "performing" | "dashing";

function ActionCard({
  choice,
  state,
  disabled,
  onPick,
}: {
  choice: ActionChoice;
  state: "idle" | "right" | "wrong";
  disabled: boolean;
  onPick: (choice: ActionChoice) => void;
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
      id={`action-choice-${choice.id.replace(/[^a-z0-9]/gi, "-")}`}
      aria-label={choice.label}
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
      className={`flex touch-none flex-col items-center justify-center rounded-2xl border-4 bg-white p-3 shadow-lg transition-transform ${
        state === "right"
          ? "tw-found border-[#2ecc71]"
          : state === "wrong"
            ? "tw-nudge border-[#c9d4de] opacity-55"
            : "border-white"
      } ${pressed && state === "idle" ? "scale-95" : ""}`}
    >
      <span className="text-4xl leading-none" aria-hidden>
        {choice.item.glyph}
      </span>
      <span className="mt-1 text-center text-xs leading-tight font-black text-[#141420] uppercase">
        {choice.label}
      </span>
    </button>
  );
}

export function ActionDashGame({
  packId,
  level,
}: {
  packId: ContentPackId;
  level: MiniLearningLevel;
}) {
  const router = useRouter();
  const game = getGame(GAME_ACTION_DASH);
  const definition = getMiniGame(GAME_ACTION_DASH);
  const { profile, setMicEnabled } = usePlayerProfile();

  const run = useMiniGameRun({
    gameId: GAME_ACTION_DASH,
    definition,
    packId,
    level,
  });
  const particles = useParticles();
  useGestureLock(true);

  const [sessionIndex, setSessionIndex] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("choosing");
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const startedRef = useRef(false);

  const rounds = useMemo(
    () =>
      planActions({ packId, level, seed: dailySeed() + sessionIndex * 857 }),
    [packId, level, sessionIndex],
  );
  const round = rounds?.[roundIndex] ?? null;
  const action = round ? getAction(round.action) : null;

  /**
   * The speech target, built from the round's `sayText`.
   *
   * Not `speechTargetFor(item, level)`: what a child says here is the
   * *action*, and an item's word in this pack already is the action, but the
   * phrase and sentence forms come from the action table rather than the
   * item. Building it here keeps what TJ performs and what the child is
   * asked to say provably the same string.
   */
  const speechTarget: MiniSpeechTarget | null = useMemo(() => {
    if (!round) return null;
    const words = splitTargetWords(round.sayText);
    return {
      id: `action-${roundIndex}-${round.action}`,
      kind: level === "expert" ? "sentence" : "word",
      text: round.sayText,
      words,
      prompt:
        level === "expert"
          ? "Say the whole sentence to make it happen!"
          : `Say ${round.sayText.toUpperCase()} to make it happen!`,
      model: round.sayText,
      glyph: round.target.glyph,
      cue: null,
      soundConfig: null,
      wordByWord: level === "expert" && words.length > 1,
    };
  }, [round, roundIndex, level]);

  const begin = run.begin;
  useEffect(() => {
    if (!rounds || startedRef.current) return;
    startedRef.current = true;
    begin();
  }, [rounds, begin]);

  const advance = useCallback(() => {
    if (!rounds) return;
    setWrongIds([]);
    if (roundIndex + 1 >= rounds.length) {
      run.finish({ completed: true });
      return;
    }
    setRoundIndex((index) => index + 1);
    setStage("choosing");
  }, [rounds, roundIndex, run]);

  const handlePick = useCallback(
    (choice: ActionChoice) => {
      if (!round || stage !== "choosing") return;

      if (!choice.isTarget) {
        run.session.wrong();
        setWrongIds((current) => [...current, choice.id]);
        return;
      }

      run.session.correct();
      particles.burst(50, 40, "💥", "#f5c33b");
      // Straight to the speech moment: identifying it earned the points,
      // and saying it is what earns the show.
      window.setTimeout(() => setStage("speaking"), 500);
    },
    [round, stage, run.session, particles],
  );

  /**
   * The speech moment closing is what starts TJ performing — then he dashes
   * off to the next command. The dash is what carries the child between
   * rounds, so there is never a frame where nothing is happening.
   */
  const handleUnlock = useCallback(
    (spoke: boolean) => {
      if (spoke) run.markSpoke();
      setStage("performing");
      miniAudio.correct(2);
      window.setTimeout(() => {
        setStage("dashing");
        window.setTimeout(advance, DASH_MS);
      }, PERFORM_MS);
    },
    [run, advance],
  );

  const handleExit = useCallback(() => run.finish({ completed: false }), [run]);

  const handleReplay = useCallback(() => {
    startedRef.current = false;
    setRoundIndex(0);
    setWrongIds([]);
    setStage("choosing");
    setSessionIndex((index) => index + 1);
    run.replay();
  }, [run]);

  if (!rounds || !round || !action) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-[#fff3c4] to-[#ffb877] p-6">
        <div className="max-w-sm rounded-[1.75rem] border-8 border-[#f5c33b] bg-white p-6 text-center shadow-2xl">
          <p className="text-2xl font-black text-[#141420]">
            This pack has no actions for that level yet.
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

  const performing = stage === "performing";
  const dashing = stage === "dashing";

  /** What TJ is doing in the scene right now. */
  const pose: TJPose = performing ? round.action : dashing ? "dash" : "idle";

  return (
    <main className="relative flex h-[100dvh] flex-col overflow-hidden bg-[#bfe9ff]">
      <MiniGameHud
        score={run.session.state.score}
        combo={run.session.state.combo}
        multiplier={run.session.state.combo > 0 ? run.session.multiplier : 1}
        roundLabel={`${roundIndex + 1} of ${rounds.length}`}
        coins={spendableCoins(profile)}
        onExit={handleExit}
      />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* The course fills everything between the coach bar and the cards.
            No gradient dead space: whatever is not UI is scene. */}
        <div className="absolute inset-0">
          <DashScene pose={pose} dashing={dashing} />
        </div>

        <div className="relative z-10 px-4 pt-3">
          <div className="mx-auto w-full max-w-md">
            <MayaCoach line={round.prompt} speak={speakerFor(speechTarget)} />
          </div>
        </div>

        {/* The shout, over the scene while he performs. */}
        <div className="pointer-events-none relative z-10 flex flex-1 items-start justify-center pt-4">
          <p
            className={`tw-pop rounded-full border-4 border-white bg-[#2ecc71] px-6 py-2.5 text-2xl font-black text-white shadow-xl transition-opacity ${
              performing ? "opacity-100" : "invisible opacity-0"
            }`}
          >
            {round.sayText.toUpperCase()}!
          </p>
        </div>

        {/* Where he is off to next. */}
        <div className="pointer-events-none relative z-10 flex justify-center pb-2">
          <p
            className={`rounded-full bg-[#141420]/55 px-4 py-1.5 text-sm font-black tracking-wide text-white uppercase backdrop-blur-sm transition-opacity ${
              dashing ? "opacity-100" : "opacity-0"
            }`}
          >
            ← Dashing to the next one!
          </p>
        </div>

        {/* The choices. They need `relative z-10` of their own: the scene
            behind them is absolutely positioned, so an unpositioned grid
            paints *underneath* the canvas and the cards vanish. */}
        <div
          className={`relative z-10 mx-auto grid w-full max-w-md gap-2 px-3 pb-3 ${
            round.choices.length > 3 ? "grid-cols-2" : "grid-cols-3"
          }`}
        >
          {round.choices.map((choice) => (
            <ActionCard
              key={choice.id}
              choice={choice}
              state={
                stage !== "choosing" && choice.isTarget
                  ? "right"
                  : wrongIds.includes(choice.id)
                    ? "wrong"
                    : "idle"
              }
              disabled={stage !== "choosing" || wrongIds.includes(choice.id)}
              onPick={handlePick}
            />
          ))}
        </div>

        <ParticleLayer bursts={particles.bursts} />
        <PowerUpBadge active={run.powerUps.active} />

        {stage === "speaking" && speechTarget && run.phase === "playing" ? (
          <MiniSpeechGate
            key={speechTarget.id}
            target={speechTarget}
            headline="Say it to make it happen"
            micEnabled={profile.micEnabled}
            assist={profile.assistMode}
            onMicEnabledChange={setMicEnabled}
            onUnlock={handleUnlock}
          />
        ) : null}

        {run.phase === "results" && run.summary && run.reward ? (
          <MiniGameResults
            title="Action Dash"
            summary={run.summary}
            reward={run.reward}
            wasPersonalBest={run.wasPersonalBest}
            bestScore={run.bestScore}
            powerUpsEarned={run.powerUps.earnedCount}
            onReplay={handleReplay}
            setupHref={game.route}
            highlight={
              run.summary.correct > 0
                ? `TJ did ${run.summary.correct} actions for you!`
                : undefined
            }
          />
        ) : null}
      </div>
    </main>
  );
}
