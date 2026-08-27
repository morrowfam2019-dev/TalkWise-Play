"use client";

/**
 * GAME-005 COLOUR & SHAPE HUNT — Miss Maya says it, you find it.
 *
 * ## Why the speech gate is not on every find
 *
 * §5 says this explicitly: "do not make every tap require microphone if it
 * slows the game down too much". A hunt is a rhythm — listen, scan, tap,
 * celebrate — and putting a microphone between every beat of it turns a
 * ninety-second game into five minutes of waiting for a recogniser.
 *
 * So the speech moment lands on the **first, fourth and seventh** finds:
 * three real speech turns in a session, at the start, the middle and near
 * the end. That is also §18's "use her strategically" — Miss Maya
 * introduces, models, and encourages, rather than narrating every second
 * until a child stops hearing her.
 *
 * The other five finds still celebrate out loud: she names what they found.
 *
 * ## Objects are shapes carrying pictures
 *
 * Each object is a coloured `ShapeGlyph` with the item's picture on it, so
 * a single object genuinely *is* "the small blue circle" and "the ball" at
 * the same time. That is what lets one scene serve a colour instruction, a
 * colour-and-shape instruction, and a full positional direction without
 * three different sets of art.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { dailySeed } from "@/content/minigames";
import { getColor, SIZES } from "@/content/minigames/attributes";
import type {
  ContentPackId,
  MiniLearningLevel,
} from "@/content/minigames/types";
import { miniAudio } from "@/minigames/audio";
import { getMiniGame } from "@/minigames/registry";
import type { MiniSpeechTarget } from "@/minigames/speech";
import { useIntentionalTap, useGestureLock } from "@/minigames/touch";
import { useMiniGameRun } from "@/minigames/useMiniGameRun";
import { MayaCoach, speakerFor } from "@/minigames/ui/MayaCoach";
import { MiniGameHud } from "@/minigames/ui/MiniGameHud";
import { MiniGameResults } from "@/minigames/ui/MiniGameResults";
import { MiniSpeechGate } from "@/minigames/ui/MiniSpeechGate";
import { ParticleLayer, useParticles } from "@/minigames/ui/Particles";
import { PowerUpBadge } from "@/minigames/ui/PowerUpBadge";
import { ShapeGlyph } from "@/minigames/ui/ShapeGlyph";
import { GAME_COLOR_SHAPE_HUNT, getGame } from "@/platform/games/registry";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { SPEECH_ON_FINDS, planHunt, type SceneObject } from "./core/scene";

type Stage = "hunting" | "found" | "speaking";

/** One object in the scene. Its own component so the shared intentional-tap
 * hook can own its press state without re-rendering the whole scene. */
function SceneObjectView({
  object,
  found,
  celebrating,
  disabled,
  onTap,
}: {
  object: SceneObject;
  found: boolean;
  celebrating: boolean;
  disabled: boolean;
  onTap: (object: SceneObject) => void;
}) {
  const [pressed, setPressed] = useState(false);
  const handlers = useIntentionalTap(
    () => {
      setPressed(false);
      onTap(object);
    },
    { disabled, onArm: () => setPressed(true) },
  );

  const scale = SIZES.find((entry) => entry.id === object.size)?.scale ?? 1;
  const color = getColor(object.color);

  return (
    <button
      type="button"
      id={`hunt-${object.id}`}
      aria-label={`${object.size} ${color.label} ${object.shape} — ${object.item.word}`}
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
      className={`absolute flex touch-none -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-opacity ${
        celebrating ? "tw-found" : ""
      } ${found && !celebrating ? "opacity-45" : ""} ${
        pressed ? "scale-90" : ""
      }`}
      style={{
        left: `${object.xPercent}%`,
        top: `${object.yPercent}%`,
        width: `${5.4 * scale}rem`,
        height: `${5.4 * scale}rem`,
        transform: `translate(-50%, -50%) rotate(${object.tiltDeg}deg)`,
      }}
    >
      <ShapeGlyph
        shape={object.shape}
        color={object.color}
        className="h-full w-full drop-shadow-lg"
      />
      <span
        className="absolute text-2xl drop-shadow"
        style={{ fontSize: `${1.5 * scale}rem` }}
        aria-hidden
      >
        {object.item.glyph}
      </span>
      {found ? (
        <span className="absolute -top-1 -right-1 text-xl" aria-hidden>
          ⭐
        </span>
      ) : null}
    </button>
  );
}

export function ColorShapeHuntGame({
  packId,
  level,
}: {
  packId: ContentPackId;
  level: MiniLearningLevel;
}) {
  const router = useRouter();
  const game = getGame(GAME_COLOR_SHAPE_HUNT);
  const definition = getMiniGame(GAME_COLOR_SHAPE_HUNT);
  const { profile, setMicEnabled } = usePlayerProfile();

  const run = useMiniGameRun({
    gameId: GAME_COLOR_SHAPE_HUNT,
    definition,
    packId,
    level,
  });
  const particles = useParticles();
  useGestureLock(true);

  const [sessionIndex, setSessionIndex] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("hunting");
  const [found, setFound] = useState<string[]>([]);
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const startedRef = useRef(false);

  const plan = useMemo(
    () => planHunt({ packId, level, seed: dailySeed() + sessionIndex * 421 }),
    [packId, level, sessionIndex],
  );
  const round = plan?.rounds[roundIndex] ?? null;

  // Start the session clock once the scene is playable. This game has no
  // countdown to start it on — the hunt begins the moment it is on screen —
  // so the clock starts in an effect rather than at a tap.
  const begin = run.begin;
  useEffect(() => {
    if (!plan || startedRef.current) return;
    startedRef.current = true;
    begin();
  }, [plan, begin]);

  /**
   * The speech target for a find, built from the *instruction word* rather
   * than from a content item: at Beginner a child is asked to say the
   * colour they found ("blue"), which is not any item's word.
   */
  const speechTarget: MiniSpeechTarget | null = useMemo(() => {
    if (!round) return null;
    const word = round.sayWord;
    return {
      id: `hunt-${round.index}-${word}`,
      kind: "word",
      text: word,
      words: [
        {
          id: "0",
          text: word,
          normalized: word.toLowerCase().replace(/[^a-z']/g, ""),
        },
      ],
      prompt: `Say ${word.toUpperCase()}!`,
      model: word,
      glyph:
        plan?.objects.find((entry) => entry.id === round.targetId)?.item
          .glyph ?? "⭐",
      cue: null,
      soundConfig: null,
      wordByWord: false,
    };
  }, [round, plan]);

  const advance = useCallback(() => {
    setCelebrating(null);
    if (!plan) return;
    if (roundIndex + 1 >= plan.rounds.length) {
      run.finish({
        completed: true,
        // Which objects a child has found is a real completion record for
        // this game, so it goes into the namespace's `collected` list.
        collected: found.map((id) => `found:${id}`),
      });
      return;
    }
    setRoundIndex((index) => index + 1);
    setStage("hunting");
  }, [plan, roundIndex, run, found]);

  const handleTap = useCallback(
    (object: SceneObject) => {
      if (!round || stage !== "hunting") return;

      if (object.id !== round.targetId) {
        // Not it. Nothing is deducted and nothing is scolded — the object
        // just does not react, and the combo breaks.
        run.session.wrong();
        miniAudio.gentleMiss();
        return;
      }

      run.session.correct();
      particles.burst(object.xPercent, object.yPercent, "⭐", "#f5c33b");
      setFound((current) => [...current, object.id]);
      setCelebrating(object.id);

      const wantsSpeech = SPEECH_ON_FINDS.includes(roundIndex);
      if (wantsSpeech) {
        window.setTimeout(() => setStage("speaking"), 700);
      } else {
        // The celebration is on screen, not spoken — see MayaCoach.
        setStage("found");
        window.setTimeout(advance, 1400);
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
    setFound([]);
    setCelebrating(null);
    setStage("hunting");
    setSessionIndex((index) => index + 1);
    run.replay();
  }, [run]);

  if (!plan || !round) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-[#ffd9ec] to-[#c9b0f5] p-6">
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

  return (
    <main className="relative flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-b from-[#fff0f7] via-[#ffe3f2] to-[#dcd0ff]">
      <MiniGameHud
        score={run.session.state.score}
        combo={run.session.state.combo}
        multiplier={run.session.state.combo > 0 ? run.session.multiplier : 1}
        roundLabel={`${roundIndex + 1} of ${plan.rounds.length}`}
        coins={spendableCoins(profile)}
        onExit={handleExit}
      />

      <div className="relative z-20 px-3 py-2">
        <div className="mx-auto max-w-md">
          <MayaCoach line={round.prompt} speak={speakerFor(speechTarget)} />
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden px-3 pb-3">
        {/* The play world. Drawn, not shipped — a soft park backdrop. */}
        <div
          className="pointer-events-none absolute inset-3 rounded-[1.5rem] border-4 border-white/70"
          aria-hidden
          style={{
            background:
              "radial-gradient(90% 70% at 50% 100%, rgba(255,255,255,0.65), transparent 70%)",
          }}
        />
        <div className="relative h-full w-full">
          {plan.objects.map((object) => (
            <SceneObjectView
              key={object.id}
              object={object}
              found={found.includes(object.id)}
              celebrating={celebrating === object.id}
              disabled={stage !== "hunting"}
              onTap={handleTap}
            />
          ))}
        </div>

        <ParticleLayer bursts={particles.bursts} />
        <PowerUpBadge active={run.powerUps.active} />

        {stage === "found" && run.phase === "playing" ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center">
            <p className="tw-pop rounded-full border-4 border-white bg-[#2ecc71] px-6 py-3 text-2xl font-black text-white shadow-xl">
              YOU FOUND IT! ⭐
            </p>
          </div>
        ) : null}

        {stage === "speaking" && speechTarget && run.phase === "playing" ? (
          <MiniSpeechGate
            key={speechTarget.id}
            target={speechTarget}
            headline="You found it! Now say it"
            micEnabled={profile.micEnabled}
            assist={profile.assistMode}
            onMicEnabledChange={setMicEnabled}
            onUnlock={handleUnlock}
            onSkip={() => handleUnlock(false)}
          />
        ) : null}

        {run.phase === "results" && run.summary && run.reward ? (
          <MiniGameResults
            title="Colour & Shape Hunt"
            summary={run.summary}
            reward={run.reward}
            wasPersonalBest={run.wasPersonalBest}
            bestScore={run.bestScore}
            powerUpsEarned={run.powerUps.earnedCount}
            onReplay={handleReplay}
            setupHref={game.route}
            highlight={
              found.length > 0 ? `You found ${found.length} things!` : undefined
            }
          />
        ) : null}
      </div>
    </main>
  );
}
