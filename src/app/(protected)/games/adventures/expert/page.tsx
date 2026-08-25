"use client";

import Link from "next/link";
import { listExpertQuests } from "@/content/speech/expert";
import { getQuestProgress } from "@/player/storage";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { PlatformHeader } from "@/ui/PlatformHeader";

/**
 * GAME-001 EXPERT — Sentence Adventures story select.
 *
 * Visually the most grown-up screen in the game: night sky, story cards,
 * quotations from the sentences themselves. Still nothing dark or startling
 * — Expert means more is being asked of a child's speech, not that the game
 * has stopped being for children.
 */
export default function ExpertHome() {
  const { profile } = usePlayerProfile();
  const quests = listExpertQuests();

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#0d1330] via-[#16215a] to-[#2b3f8f]">
      <PlatformHeader
        eyebrow="Speech Adventures · Expert"
        accent="text-[#8fa8ff]"
        title={
          <>
            Sentence <span className="text-[#8fa8ff]">Adventures</span>
          </>
        }
        coins={spendableCoins(profile)}
        streak={profile.currentStreak}
        backHref="/games/adventures"
        backLabel="← Levels"
      />

      <div className="mx-auto max-w-3xl px-5 pt-6 pb-16">
        <p className="rounded-[1.5rem] border-4 border-[#8fa8ff]/40 bg-white/10 p-5 text-base font-semibold text-[#dbe5ff] backdrop-blur-sm">
          Talk your way through a story. A character asks you something, you
          say a whole sentence, and the world answers. Miss Maya will say any
          sentence — or any single word — whenever you want to hear it.
        </p>

        <h2 className="mt-8 mb-3 text-xs font-black tracking-[0.22em] text-[#8fa8ff] uppercase">
          Choose your story
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          {quests.map((quest) => {
            const progress = getQuestProgress(profile, quest.id);
            const opener = quest.scenes[0]?.sentence ?? "";
            return (
              <article
                key={quest.id}
                className="overflow-hidden rounded-[1.5rem] border-4 border-[#8fa8ff]/40 bg-[#101736] shadow-xl"
              >
                <div
                  className={`relative flex h-28 items-center justify-center bg-gradient-to-br ${quest.cardGradient}`}
                >
                  <span className="text-5xl drop-shadow-lg" aria-hidden>
                    {quest.glyph}
                  </span>
                  {progress.completed ? (
                    <span className="absolute top-3 right-3 rounded-full bg-white px-3 py-1 text-xs font-black text-[#2ecc71]">
                      ★ TOLD
                    </span>
                  ) : null}
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-black tracking-tight text-white">
                    {quest.title}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-[#a9b8e8]">
                    {quest.tagline}
                  </p>
                  <p className="mt-3 rounded-xl bg-[#182347] px-3 py-2 text-sm font-bold text-[#cfe0ff] italic">
                    “{opener}”
                  </p>
                  <p className="mt-2 text-xs font-bold text-[#8fa8ff]">
                    {quest.scenes.length}{" "}
                    {quest.scenes.length === 1 ? "sentence" : "sentences"} ·{" "}
                    {quest.characterName}
                  </p>
                  {progress.bestScenes > 0 ? (
                    <p className="mt-2 text-xs font-bold text-white/55">
                      Best: {progress.bestScenes}/{quest.scenes.length} ·{" "}
                      {progress.bestCoins} coins
                    </p>
                  ) : null}

                  <Link
                    href={`/games/adventures/expert/${quest.id}`}
                    className="mt-4 block w-full rounded-2xl border-b-8 border-[#2563eb] bg-[#3b82f6] px-6 py-4 text-center text-xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
                  >
                    START
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/games/adventures"
            className="text-xs font-bold text-[#8fa8ff] underline"
          >
            ← Back to Speech Adventures
          </Link>
        </div>
      </div>
    </main>
  );
}
