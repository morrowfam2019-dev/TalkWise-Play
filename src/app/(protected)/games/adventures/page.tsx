"use client";

import Link from "next/link";
import { listExpertQuests } from "@/content/speech/expert";
import { listLevels } from "@/content/speech";
import { GAME_ADVENTURES, getGame } from "@/platform/games/registry";
import { listExplorerMaps } from "@/games/adventures/explorer/maps";
import { getMapProgress, getQuestProgress } from "@/player/storage";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { CoinIcon } from "@/ui/CoinIcon";
import { PlatformHeader } from "@/ui/PlatformHeader";

/**
 * GAME-001 Speech Adventures — the stage picker.
 *
 * The front door of the game is now the progression itself, because that
 * progression is the product:
 *
 * ```
 * BEGINNER      I can make the sound.       /m/
 * INTERMEDIATE  I can use it in a word.     MOON
 * EXPERT        I can use it in a sentence. "I see the big moon."
 * ```
 *
 * No stage is locked behind another. A family picks where their child
 * belongs today, and can move up or down whenever they like — placement is
 * a product decision for later, and guessing at it here would mean the game
 * telling a four-year-old what they are not ready for.
 */
export default function AdventuresHome() {
  const { profile, adventures } = usePlayerProfile();
  const game = getGame(GAME_ADVENTURES);

  const maps = listExplorerMaps();
  const levels = listLevels();
  const quests = listExpertQuests();

  const soundsLit = maps.reduce((total, map) => {
    const saved = getMapProgress(profile, map.id);
    return (
      total +
      map.stations.filter((station) => {
        const record = saved.stations[station.soundId];
        return record !== undefined && record.completions > 0;
      }).length
    );
  }, 0);
  const totalStations = maps.reduce((total, map) => total + map.stations.length, 0);

  const levelsDone = levels.filter(
    (level) => adventures.levels[level.id]?.completed,
  ).length;

  const questsDone = quests.filter(
    (quest) => getQuestProgress(profile, quest.id).completed,
  ).length;

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#8fd8f5] via-[#bfeafb] to-[#eaf8e6]">
      <PlatformHeader
        eyebrow="TalkWise Play"
        title={
          <>
            Speech <span className="text-[#6fd36b]">Adventures</span>
          </>
        }
        coins={spendableCoins(profile)}
        streak={profile.currentStreak}
        backHref="/"
        backLabel="← Games"
      />

      <div className="mx-auto max-w-3xl px-5 pt-6 pb-16">
        <p className="rounded-[1.5rem] border-4 border-white bg-white/85 p-5 text-base font-semibold text-[#4a4a60] shadow-lg backdrop-blur-sm">
          {game.tagline} Pick where you want to play today — sounds, words, or
          sentences.
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
              Characters, hats, auras and boosts for every adventure.
            </span>
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[#fff4d6] px-3 py-1.5 text-sm font-black text-[#b8860b] tabular-nums">
            <CoinIcon className="h-4 w-4" />
            {spendableCoins(profile)}
          </span>
        </Link>

        <h2 className="mt-8 mb-3 text-xs font-black tracking-[0.22em] text-[#3c5a68] uppercase">
          Choose your level
        </h2>

        <div className="grid gap-5">
          <TierCard
            href="/games/adventures/beginner"
            eyebrow="Beginner"
            title="Sound Explorer"
            blurb="Big open worlds to explore. Find a glowing letter and make its sound."
            example="/m/"
            exampleLabel="Say the sound"
            glyph="🛝"
            gradient="from-[#ffd76a] to-[#f0a020]"
            progress={
              totalStations > 0
                ? `${soundsLit} / ${totalStations} sounds found`
                : null
            }
            cta="EXPLORE"
          />

          <TierCard
            href="/games/adventures/intermediate"
            eyebrow="Intermediate"
            title="Word Adventures"
            blurb="The adventures you know. Explore a world and say your target words out loud."
            example="MOON"
            exampleLabel="Say the word"
            glyph="🗺️"
            gradient="from-[#6fd36b] to-[#2fa85a]"
            progress={`${levelsDone} / ${levels.length} adventures finished`}
            cta="PLAY"
          />

          <TierCard
            href="/games/adventures/expert"
            eyebrow="Expert"
            title="Sentence Adventures"
            blurb="Talk your way through a story. Say whole sentences and watch the world answer."
            example="“I see the big moon.”"
            exampleLabel="Say the sentence"
            glyph="💬"
            gradient="from-[#5b7cfa] to-[#2b3f8f]"
            progress={`${questsDone} / ${quests.length} stories finished`}
            cta="START"
          />
        </div>

        <p className="mt-8 rounded-2xl border-4 border-white/70 bg-white/60 p-4 text-center text-xs font-semibold text-[#4a6b78]">
          Every level is open. Start wherever your child is happiest today —
          they can move between them any time.
        </p>

        <div className="mt-8 text-center">
          <Link href="/" className="text-xs font-bold text-[#4a6b78] underline">
            ← Back to TalkWise Play
          </Link>
        </div>
      </div>
    </main>
  );
}

function TierCard({
  href,
  eyebrow,
  title,
  blurb,
  example,
  exampleLabel,
  glyph,
  gradient,
  progress,
  cta,
}: {
  href: string;
  eyebrow: string;
  title: string;
  blurb: string;
  example: string;
  exampleLabel: string;
  glyph: string;
  gradient: string;
  progress: string | null;
  cta: string;
}) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border-4 border-white bg-white shadow-xl">
      <div
        className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${gradient}`}
      >
        <span className="text-6xl drop-shadow-lg" aria-hidden>
          {glyph}
        </span>
        <span className="absolute top-3 left-4 rounded-full bg-white/90 px-3 py-1 text-[0.6rem] font-black tracking-[0.18em] text-[#141420] uppercase">
          {eyebrow}
        </span>
      </div>

      <div className="p-5">
        <h3 className="text-2xl font-black tracking-tight text-[#141420]">
          {title}
        </h3>
        <p className="mt-1 text-sm font-medium text-[#4a4a60]">{blurb}</p>

        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#f3f4f8] px-4 py-3">
          <span className="text-[0.6rem] font-black tracking-[0.16em] text-[#8a8aa0] uppercase">
            {exampleLabel}
          </span>
          <span className="ml-auto text-lg font-black text-[#141420]">
            {example}
          </span>
        </div>

        {progress ? (
          <p className="mt-3 rounded-lg bg-[#eaf4ff] px-3 py-1.5 text-xs font-bold text-[#2f7fd4]">
            {progress}
          </p>
        ) : null}

        <Link
          href={href}
          className="mt-4 block w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-4 text-center text-xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
        >
          {cta}
        </Link>
      </div>
    </article>
  );
}
