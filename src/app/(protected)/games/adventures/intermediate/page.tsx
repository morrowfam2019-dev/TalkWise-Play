"use client";

import Link from "next/link";
import { COMING_SOON } from "@/content/comingSoon";
import { getLevel, listLevels } from "@/content/speech";
import { GAME_ADVENTURES, getGame } from "@/platform/games/registry";
import { getLevelProgress, isLevelUnlocked } from "@/player/storage";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { CoinIcon } from "@/ui/CoinIcon";
import { PlatformHeader } from "@/ui/PlatformHeader";

/**
 * GAME-001 INTERMEDIATE — Word Adventures.
 *
 * **This screen is the original Speech Adventures home, relocated.** It was
 * moved from `/games/adventures` to `/games/adventures/intermediate` when
 * the game grew a three-stage progression, and the level list, the cards,
 * the unlock rules, the target words, the saved records and the adventures
 * they launch are all exactly as they were. The only edits are the two that
 * relocation requires: the header now says which stage this is, and "back"
 * goes up to the stage picker instead of straight out to the library.
 *
 * The word adventures themselves — worlds, characters, movement, speech
 * interactions, progression — were not touched at all.
 */
export default function IntermediateHome() {
  const { profile } = usePlayerProfile();
  const game = getGame(GAME_ADVENTURES);
  const levels = listLevels();

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#8fd8f5] via-[#bfeafb] to-[#eaf8e6]">
      <PlatformHeader
        eyebrow="Intermediate"
        title={
          <>
            Word <span className="text-[#6fd36b]">Adventures</span>
          </>
        }
        coins={spendableCoins(profile)}
        streak={profile.currentStreak}
        backHref="/games/adventures"
        backLabel="← Levels"
      />

      <div className="mx-auto max-w-3xl px-5 pt-6 pb-16">
        <p className="rounded-[1.5rem] border-4 border-white bg-white/85 p-5 text-base font-semibold text-[#4a4a60] shadow-lg backdrop-blur-sm">
          Practise your sound inside whole words. {game.tagline}
        </p>

        <Link
          href="/games/adventures/shop"
          className="mt-4 flex items-center gap-4 rounded-[1.5rem] border-4 border-white bg-white/85 p-4 shadow-lg backdrop-blur-sm transition-transform active:translate-y-0.5"
        >
          <span className="text-4xl" aria-hidden>
            🛍️
          </span>
          <span className="flex-1 text-left">
            <span className="block text-lg font-black tracking-tight text-[#141420]">
              Adventure Store
            </span>
            <span className="block text-sm font-semibold text-[#6b6b80]">
              Characters, hats, auras and boosts for your adventures.
            </span>
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[#fff4d6] px-3 py-1.5 text-sm font-black text-[#b8860b] tabular-nums">
            <CoinIcon className="h-4 w-4" />
            {spendableCoins(profile)}
          </span>
        </Link>

        <h2 className="mt-8 mb-3 text-xs font-black tracking-[0.22em] text-[#3c5a68] uppercase">
          Choose your sound
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {levels.map((level) => {
            const progress = getLevelProgress(profile, level.id);
            const unlocked = isLevelUnlocked(profile, level);

            if (!unlocked) {
              const requiredTitle =
                getLevel(level.unlockRequires ?? "")?.title ??
                "the previous adventure";
              return (
                <article
                  key={level.id}
                  className="overflow-hidden rounded-[1.5rem] border-4 border-white/70 bg-white/55 shadow-md"
                >
                  <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-[#c9d4de] to-[#a8b6c4]">
                    <span className="text-5xl font-black text-white/70 drop-shadow-lg">
                      {level.sound.label}
                    </span>
                    <span
                      className="absolute top-3 right-3 text-2xl"
                      aria-hidden
                    >
                      🔒
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-black tracking-tight text-[#5c6472]">
                      {level.title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-[#8a8aa0]">
                      Target sound: {level.sound.label}
                    </p>
                    <p className="mt-4 block w-full rounded-2xl bg-[#d7dde4] px-6 py-4 text-center text-sm font-black text-[#7b8494]">
                      Complete {requiredTitle} to unlock
                    </p>
                  </div>
                </article>
              );
            }

            return (
              <article
                key={level.id}
                className="overflow-hidden rounded-[1.5rem] border-4 border-white bg-white shadow-xl"
              >
                <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-[#6fd36b] to-[#2fa85a]">
                  <span className="text-6xl font-black text-white drop-shadow-lg">
                    {level.sound.label}
                  </span>
                  {progress.completed ? (
                    <span className="absolute top-3 right-3 rounded-full bg-white px-3 py-1 text-xs font-black text-[#2ecc71]">
                      ★ COMPLETE
                    </span>
                  ) : null}
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-black tracking-tight text-[#141420]">
                    {level.title}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-[#6b6b80]">
                    Target sound: {level.sound.label} ·{" "}
                    {level.challenges.length} speech challenges
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#4a4a60]">
                    {level.tagline}
                  </p>

                  {progress.bestCheckpoints > 0 ? (
                    <p className="mt-3 rounded-lg bg-[#f3f4f8] px-3 py-1.5 text-xs font-bold text-[#4a4a60]">
                      Best: {progress.bestCheckpoints}/{level.challenges.length}{" "}
                      challenges · {progress.bestCoins} coins
                    </p>
                  ) : null}

                  <Link
                    href={`/games/adventures/play/${level.id}`}
                    className="mt-4 block w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-4 text-center text-xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
                  >
                    PLAY
                  </Link>
                </div>
              </article>
            );
          })}

          {COMING_SOON.map((entry) => (
            <article
              key={entry.title}
              className="overflow-hidden rounded-[1.5rem] border-4 border-white/70 bg-white/55 shadow-md"
            >
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-[#c9d4de] to-[#a8b6c4]">
                <span className="text-5xl opacity-70" aria-hidden>
                  {entry.glyph}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-black tracking-tight text-[#5c6472]">
                  {entry.title}
                </h3>
                <p className="mt-1 text-sm font-semibold text-[#8a8aa0]">
                  Target sound: {entry.soundLabel}
                </p>
                <p className="mt-4 block w-full rounded-2xl bg-[#d7dde4] px-6 py-4 text-center text-lg font-black text-[#7b8494]">
                  COMING SOON
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/games/adventures"
            className="text-xs font-bold text-[#4a6b78] underline"
          >
            ← Back to Speech Adventures
          </Link>
        </div>
      </div>
    </main>
  );
}
