"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ExpertQuest } from "@/content/speech/expert";
import { playExampleSentence } from "@/speech/maya-voice";
import { getQuestProgress } from "@/player/storage";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { CoinIcon } from "@/ui/CoinIcon";
import { PlatformHeader } from "@/ui/PlatformHeader";
import { SentenceChallenge } from "./ui/SentenceChallenge";

type Phase = "setup" | "speaking" | "outcome" | "results";

/**
 * EXPERT — one sentence quest.
 *
 * ## Why this is not a 3D level
 *
 * Expert is a *communication* challenge, not a traversal one. The founder
 * brief asks for a distinct, more grown-up, story-driven experience rather
 * than harder words bolted onto the word adventures — so the frame here is
 * a story you talk your way through: a character puts a situation to you,
 * you say a sentence, and the world answers. Walking to the next checkpoint
 * would add nothing to that and would make Expert read as Intermediate with
 * longer signs.
 *
 * It is also the honest scope call. One polished, working, mobile-first
 * Expert experience shipped now beats a half-built second 3D engine, and
 * this is a framework: everything on screen comes from `ExpertQuest` data,
 * so adding a story is a content change.
 *
 * ## The loop
 *
 * ```
 * setup   the character sets the scene
 *   ↓
 * speaking the sentence, word by word, with Miss Maya on tap
 *   ↓
 * outcome  what the sentence changed
 *   ↓     (next scene, or…)
 * results  the quest, and what it is worth
 * ```
 */
export function QuestShell({
  quest,
  onExit,
}: {
  quest: ExpertQuest;
  onExit: () => void;
}) {
  const { profile, recordQuestRun, setMicEnabled } = usePlayerProfile();

  const [sceneIndex, setSceneIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("setup");
  const [coins, setCoins] = useState(0);
  const [scenesDone, setScenesDone] = useState(0);
  // A ref, not state: writing the run must not itself cause a render, which
  // is the same guard the word adventures' shell uses for the same reason.
  const recordedRef = useRef(false);

  const scene = quest.scenes[sceneIndex];
  const isLastScene = sceneIndex === quest.scenes.length - 1;

  // Read once at mount: the "new best" badge should compare against the
  // record the child walked in with, not the one this run just wrote.
  const [previousBest] = useState(() => getQuestProgress(profile, quest.id));

  // The character reads the situation aloud as each scene opens, so a child
  // who reads slowly is never waiting on the text to catch up.
  useEffect(() => {
    if (phase !== "setup" || !scene) return;
    const timer = window.setTimeout(() => playExampleSentence(scene.setup), 400);
    return () => window.clearTimeout(timer);
  }, [phase, scene]);

  const handleSentenceComplete = useCallback(() => {
    if (!scene) return;
    setCoins((current) => current + scene.reward);
    setScenesDone((current) => current + 1);
    setPhase("outcome");
  }, [scene]);

  const handleNext = useCallback(() => {
    if (isLastScene) {
      setPhase("results");
      return;
    }
    setSceneIndex((current) => current + 1);
    setPhase("setup");
  }, [isLastScene]);

  // Persist exactly once, when the results screen appears — the same rule
  // the word adventures use, for the same reason.
  useEffect(() => {
    if (phase !== "results" || recordedRef.current) return;
    recordedRef.current = true;
    recordQuestRun(quest.id, {
      scenes: scenesDone,
      coins,
      completed: scenesDone === quest.scenes.length,
    });
  }, [phase, recordQuestRun, quest.id, quest.scenes.length, scenesDone, coins]);

  const handleReplay = useCallback(() => {
    setSceneIndex(0);
    setScenesDone(0);
    setCoins(0);
    recordedRef.current = false;
    setPhase("setup");
  }, []);

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#0d1330] via-[#16215a] to-[#26307a]">
      <PlatformHeader
        eyebrow="Speech Adventures · Expert"
        accent="text-[#8fa8ff]"
        title={<>{quest.title}</>}
        coins={spendableCoins(profile)}
        streak={profile.currentStreak}
        backHref="/games/adventures/expert"
        backLabel="← Stories"
      />

      <div className="mx-auto max-w-2xl px-5 pt-5 pb-16">
        {/* Scene progress — dots, so the story reads as a story with a shape
            rather than as a worksheet with a count. */}
        <div className="flex items-center justify-center gap-2">
          {quest.scenes.map((entry, index) => (
            <span
              key={entry.id}
              aria-hidden
              className={`h-3 rounded-full transition-all ${
                index < scenesDone
                  ? "w-8 bg-[#2ecc71]"
                  : index === sceneIndex && phase !== "results"
                    ? "w-8 bg-[#f5c33b]"
                    : "w-3 bg-white/25"
              }`}
            />
          ))}
        </div>

        {phase === "results" || !scene ? (
          <section className="tw-pop mt-6 rounded-[2rem] border-8 border-[#f5c33b] bg-white p-7 text-center shadow-2xl">
            <div className="text-7xl" aria-hidden>
              {scenesDone === quest.scenes.length ? "🏆" : "⭐"}
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#141420]">
              {scenesDone === quest.scenes.length
                ? "Story complete!"
                : "Nice talking!"}
            </h2>
            <p className="mt-2 text-lg font-bold text-[#4a4a60]">
              You spoke {scenesDone} of {quest.scenes.length}{" "}
              {quest.scenes.length === 1 ? "sentence" : "sentences"}.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#fff4d6] px-5 py-2 text-2xl font-black text-[#b8860b]">
              +{coins}
              <CoinIcon className="h-6 w-6" />
            </p>
            {coins > previousBest.bestCoins && previousBest.bestCoins > 0 ? (
              <p className="mt-3 text-sm font-black text-[#2ecc71]">
                ★ NEW BEST
              </p>
            ) : null}

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={handleReplay}
                className="w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
              >
                🔁 TELL IT AGAIN
              </button>
              <button
                type="button"
                onClick={onExit}
                className="w-full rounded-2xl border-4 border-[#e2e4ee] px-6 py-4 text-lg font-black text-[#4a4a60]"
              >
                📖 ANOTHER STORY
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* The character and the situation. */}
            <section className="mt-5 rounded-[1.5rem] border-4 border-[#8fa8ff]/50 bg-[#f7f4ea] p-5 shadow-xl">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#e5dcc6] text-3xl"
                  aria-hidden
                >
                  {quest.characterGlyph}
                </span>
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-black tracking-[0.18em] text-[#8a7a52] uppercase">
                    {quest.characterName}
                  </p>
                  <p className="text-lg font-black text-[#2a2415]">
                    Scene {sceneIndex + 1} of {quest.scenes.length}
                  </p>
                </div>
                <span className="ml-auto text-4xl" aria-hidden>
                  {scene.glyph}
                </span>
              </div>

              <p className="mt-4 text-base leading-relaxed font-semibold text-[#3a3222]">
                {scene.setup}
              </p>

              <button
                type="button"
                onClick={() => playExampleSentence(scene.setup)}
                className="mt-3 rounded-xl border-2 border-[#c4b48c] px-3 py-2 text-xs font-black text-[#6a5c38]"
              >
                🔊 Read it to me
              </button>
            </section>

            {phase === "setup" ? (
              <button
                type="button"
                onClick={() => setPhase("speaking")}
                className="mt-5 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-2xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
              >
                💬 MY TURN
              </button>
            ) : null}

            {phase === "speaking" ? (
              <div className="mt-5">
                <SentenceChallenge
                  key={scene.id}
                  sentence={scene.sentence}
                  ask={scene.ask}
                  micEnabled={profile.micEnabled}
                  assist={profile.assistMode}
                  onMicEnabledChange={setMicEnabled}
                  onComplete={handleSentenceComplete}
                />
              </div>
            ) : null}

            {phase === "outcome" ? (
              <section className="tw-pop mt-5 rounded-[1.5rem] border-4 border-[#2ecc71] bg-[#0f2a1e] p-5 text-center shadow-xl">
                <div className="text-5xl" aria-hidden>
                  ✨
                </div>
                <p className="mt-2 text-lg leading-relaxed font-bold text-[#c9f7dc]">
                  {scene.outcome}
                </p>
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#fff4d6] px-4 py-1.5 text-xl font-black text-[#b8860b]">
                  +{scene.reward}
                  <CoinIcon className="h-5 w-5" />
                </p>
                <button
                  type="button"
                  onClick={handleNext}
                  className="mt-5 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
                >
                  {isLastScene ? "🏁 FINISH THE STORY" : "▶ WHAT HAPPENS NEXT"}
                </button>
              </section>
            ) : null}
          </>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/games/adventures/expert"
            className="text-xs font-bold text-[#8fa8ff] underline"
          >
            ← Back to Sentence Adventures
          </Link>
        </div>
      </div>
    </main>
  );
}
