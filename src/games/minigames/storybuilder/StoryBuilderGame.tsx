"use client";

/**
 * GAME-008 STORY BUILDER — pick the words, build the sentence, watch it
 * happen.
 *
 * The language game, and the one place §5's Expert tier gets its full
 * expression: a child assembles a whole sentence from parts they chose,
 * hears Miss Maya model the exact sentence *they* built, says it, and the
 * scene plays it back.
 *
 * ## No wrong answers, by design
 *
 * Every choice in a slot yields a sensible sentence, so there is nothing to
 * get wrong and nothing to be told off for. Points come from completing
 * slots, not from matching a hidden answer. §17 rules out failure framing,
 * and a construction toy that scolds you for what you built is not a
 * construction toy.
 *
 * That does mean the combo here measures *sustained building* rather than
 * accuracy, and the accuracy figure on the results screen is always 100%.
 * That is honest rather than flattering: this game has no wrong actions to
 * count, so it does not invent any.
 *
 * ## Finished stories are saved
 *
 * Each completed sentence goes into the GAME-008 namespace's `collected`
 * list — the one game-defined field §20 leaves open. It is what would let a
 * "stories you have made" screen exist later without a migration.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { dailySeed } from "@/content/minigames";
import type {
  ContentPackId,
  MiniLearningLevel,
} from "@/content/minigames/types";
import { splitTargetWords } from "@/content/speech/engine";
import { getMiniGame } from "@/minigames/registry";
import type { MiniSpeechTarget } from "@/minigames/speech";
import { useGestureLock, useIntentionalTap } from "@/minigames/touch";
import { useMiniGameRun } from "@/minigames/useMiniGameRun";
import { MayaCoach, speakerFor } from "@/minigames/ui/MayaCoach";
import { MiniGameHud } from "@/minigames/ui/MiniGameHud";
import { MiniGameResults } from "@/minigames/ui/MiniGameResults";
import { MiniSpeechGate } from "@/minigames/ui/MiniSpeechGate";
import { ParticleLayer, useParticles } from "@/minigames/ui/Particles";
import { TJ } from "@/minigames/ui/TJ";
import { GAME_STORY_BUILDER, getGame } from "@/platform/games/registry";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { planStory, type StoryChoice } from "./core/story";

/** How long the finished scene plays before the next one. */
const SCENE_PLAY_MS = 2600;

type Stage = "building" | "modelling" | "speaking" | "playing";

function WordCard({
  choice,
  disabled,
  onPick,
}: {
  choice: StoryChoice;
  disabled: boolean;
  onPick: (choice: StoryChoice) => void;
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
      id={`story-choice-${choice.id.replace(/[^a-z0-9]/gi, "-")}`}
      aria-label={choice.word}
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
      className={`flex touch-none flex-col items-center justify-center rounded-2xl border-4 border-white bg-white p-3 shadow-lg transition-transform ${
        pressed ? "scale-95" : ""
      }`}
    >
      <span className="text-3xl leading-none" aria-hidden>
        {choice.glyph}
      </span>
      <span className="mt-1 text-center text-sm leading-tight font-black text-[#141420] uppercase">
        {choice.word}
      </span>
    </button>
  );
}

export function StoryBuilderGame({
  packId,
  level,
}: {
  packId: ContentPackId;
  level: MiniLearningLevel;
}) {
  const router = useRouter();
  const game = getGame(GAME_STORY_BUILDER);
  const definition = getMiniGame(GAME_STORY_BUILDER);
  const { profile, setMicEnabled } = usePlayerProfile();

  const run = useMiniGameRun({
    gameId: GAME_STORY_BUILDER,
    definition,
    packId,
    level,
  });
  const particles = useParticles();
  useGestureLock(true);

  const [sessionIndex, setSessionIndex] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [slotIndex, setSlotIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [pickedGlyphs, setPickedGlyphs] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>("building");
  const [stories, setStories] = useState<string[]>([]);
  const startedRef = useRef(false);

  const scenes = useMemo(
    () => planStory({ packId, level, seed: dailySeed() + sessionIndex * 1009 }),
    [packId, level, sessionIndex],
  );
  const scene = scenes?.[sceneIndex] ?? null;
  const slot = scene?.slots[slotIndex] ?? null;

  const sentence = scene ? scene.sentenceFor(picked) : "";
  const complete = scene ? slotIndex >= scene.slots.length : false;

  const speechTarget: MiniSpeechTarget | null = useMemo(() => {
    if (!complete || !sentence) return null;
    const words = splitTargetWords(sentence);
    return {
      id: `story-${sceneIndex}-${sentence}`,
      kind: level === "beginner" ? "word" : "sentence",
      text: sentence,
      words,
      prompt:
        level === "beginner"
          ? `Say ${sentence.toUpperCase()}!`
          : "Say your story out loud!",
      model: sentence,
      glyph: pickedGlyphs[0] ?? "📖",
      cue: null,
      soundConfig: null,
      wordByWord: level !== "beginner" && words.length > 1,
    };
  }, [complete, sentence, sceneIndex, level, pickedGlyphs]);

  const begin = run.begin;
  useEffect(() => {
    if (!scenes || startedRef.current) return;
    startedRef.current = true;
    begin();
  }, [scenes, begin]);

  const nextScene = useCallback(() => {
    if (!scenes) return;
    const finishedStory = sentence;
    const nextStories = finishedStory ? [...stories, finishedStory] : stories;
    setStories(nextStories);

    if (sceneIndex + 1 >= scenes.length) {
      run.finish({
        completed: true,
        collected: nextStories.map((story) => `story:${story}`),
      });
      return;
    }
    setSceneIndex((index) => index + 1);
    setSlotIndex(0);
    setPicked([]);
    setPickedGlyphs([]);
    setStage("building");
  }, [scenes, sceneIndex, run, sentence, stories]);

  const handlePick = useCallback(
    (choice: StoryChoice) => {
      if (stage !== "building" || !scene) return;
      // Completing a slot is what scores. There is no wrong choice here —
      // see the note at the top of this file.
      run.session.correct();
      particles.burst(50, 30, "✨", "#a273e8");

      const nextPicked = [...picked, choice.word];
      setPicked(nextPicked);
      setPickedGlyphs((current) => [...current, choice.glyph]);
      setSlotIndex((index) => index + 1);

      // Filling the last slot is what finishes the story, so the handoff to
      // Miss Maya happens here rather than in an effect watching for
      // completeness — the tap is the event, and reacting to it in an effect
      // would just be the same transition one render later.
      if (nextPicked.length >= scene.slots.length) {
        // The finished sentence is shown, not read aloud — the child hears
        // it only if they press the speaker, and only if it is recorded.
        setStage("modelling");
        window.setTimeout(() => setStage("speaking"), 1600);
      }
    },
    [stage, scene, run.session, particles, picked],
  );

  const handleUnlock = useCallback(
    (spoke: boolean) => {
      if (spoke) run.markSpoke();
      setStage("playing");
      window.setTimeout(nextScene, SCENE_PLAY_MS);
    },
    [run, nextScene],
  );

  const handleExit = useCallback(() => run.finish({ completed: false }), [run]);

  const handleReplay = useCallback(() => {
    startedRef.current = false;
    setSceneIndex(0);
    setSlotIndex(0);
    setPicked([]);
    setPickedGlyphs([]);
    setStories([]);
    setStage("building");
    setSessionIndex((index) => index + 1);
    run.replay();
  }, [run]);

  if (!scenes || !scene) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-[#e6e0ff] to-[#b79cff] p-6">
        <div className="max-w-sm rounded-[1.75rem] border-8 border-[#f5c33b] bg-white p-6 text-center shadow-2xl">
          <p className="text-2xl font-black text-[#141420]">
            This pack has no stories for that level yet.
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

  const playing = stage === "playing";

  return (
    <main
      className={`relative flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-b ${scene.backdrop}`}
    >
      <MiniGameHud
        score={run.session.state.score}
        combo={run.session.state.combo}
        multiplier={run.session.state.combo > 0 ? run.session.multiplier : 1}
        roundLabel={`${sceneIndex + 1} of ${scenes.length}`}
        coins={spendableCoins(profile)}
        onExit={handleExit}
      />

      <div className="relative flex flex-1 flex-col overflow-hidden px-4 py-3">
        {/* The story panel — the comic frame the sentence is being built in. */}
        <div
          className={`relative mx-auto w-full max-w-md rounded-[1.5rem] border-8 border-white bg-white/80 p-4 shadow-xl ${
            playing ? "tw-scene" : ""
          }`}
        >
          <p className="text-[0.6rem] font-black tracking-[0.2em] text-[#8a8aa0] uppercase">
            Your story
          </p>
          <p className="min-h-[3.5rem] text-2xl leading-tight font-black text-[#141420]">
            {sentence || "..."}
            {!complete ? (
              <span className="ml-1 text-[#a273e8]" aria-hidden>
                ___
              </span>
            ) : null}
          </p>
          <div className="mt-1 flex gap-1 text-2xl" aria-hidden>
            {pickedGlyphs.map((glyph, index) => (
              <span key={index} className="tw-star">
                {glyph}
              </span>
            ))}
          </div>
        </div>

        {/* The scene. TJ watches while it is built, and cheers when it
            plays. Laid out bottom-up so the celebration sits on his head
            rather than a screen away from him. */}
        <div className="relative flex flex-1 flex-col items-center justify-end pb-3">
          <p
            className={`tw-pop mb-1 rounded-full border-4 border-white bg-[#a273e8] px-5 py-2 text-lg font-black text-white shadow-xl ${
              playing ? "opacity-100" : "invisible opacity-0"
            }`}
          >
            ⭐ WHAT A STORY! ⭐
          </p>
          <div className={playing ? "tw-act-clap origin-bottom" : "tw-float"}>
            <TJ
              mood={playing ? "cheer" : complete ? "happy" : "think"}
              className="h-32 w-28 sm:h-40 sm:w-32"
            />
          </div>
        </div>

        {/* The slot being filled. */}
        {stage === "building" && slot ? (
          <div className="mx-auto w-full max-w-md">
            <MayaCoach line={slot.question} />
            <div className="mt-2 grid grid-cols-3 gap-2">
              {slot.choices.map((choice) => (
                <WordCard
                  key={choice.id}
                  choice={choice}
                  disabled={false}
                  onPick={handlePick}
                />
              ))}
            </div>
          </div>
        ) : null}

        {stage === "modelling" ? (
          <div className="mx-auto w-full max-w-md">
            <MayaCoach
              line={sentence}
              speak={speakerFor(speechTarget)}
              tone="praise"
            />
          </div>
        ) : null}

        <ParticleLayer bursts={particles.bursts} />

        {stage === "speaking" && speechTarget && run.phase === "playing" ? (
          <MiniSpeechGate
            key={speechTarget.id}
            target={speechTarget}
            headline="Your turn — say your story"
            micEnabled={profile.micEnabled}
            assist={profile.assistMode}
            onMicEnabledChange={setMicEnabled}
            onUnlock={handleUnlock}
          />
        ) : null}

        {run.phase === "results" && run.summary && run.reward ? (
          <MiniGameResults
            title="Story Builder"
            summary={run.summary}
            reward={run.reward}
            wasPersonalBest={run.wasPersonalBest}
            bestScore={run.bestScore}
            powerUpsEarned={run.powerUps.earnedCount}
            onReplay={handleReplay}
            setupHref={game.route}
            highlight={
              stories.length > 0
                ? `You built ${stories.length} ${
                    stories.length === 1 ? "story" : "stories"
                  }!`
                : undefined
            }
          />
        ) : null}
      </div>
    </main>
  );
}
