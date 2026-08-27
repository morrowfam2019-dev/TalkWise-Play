"use client";

/**
 * Choose a pack, choose a level, play.
 *
 * Shared by all six mini-games rather than written six times: the two
 * choices are identical everywhere and only the game's identity and its
 * play link differ. A seventh mini-game gets its setup screen for free.
 *
 * ## Flow decision
 *
 * GAME → PACK → LEVEL, and the PLAY button is always live. A child who
 * taps a mini-game card should be able to reach the game in one more tap;
 * every choice on this screen has a sensible default (the pack and level
 * they chose last time, remembered per game in `lastSetup`) so nothing here
 * is a wall between a four-year-old and the thing they wanted.
 *
 * That is also the §2 promise: mini-games start quickly and need minimal
 * instruction. A setup screen that must be completed is a setup screen that
 * defeats the point of a thirty-second game.
 */

import Link from "next/link";
import { useState } from "react";
import { getContentPack, listContentPacks } from "@/content/minigames";
import {
  MINI_LEARNING_LEVELS,
  type ContentPackId,
  type MiniLearningLevel,
} from "@/content/minigames/types";
import { getGame } from "@/platform/games/registry";
import { getMiniRecordFrom } from "@/player/games/minigames";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { PlatformHeader } from "@/ui/PlatformHeader";
import { emitMiniGameEvent } from "../analytics";
import { miniAudio } from "../audio";
import {
  coerceLevel,
  coercePack,
  packsFor,
  type MiniGameDefinition,
} from "../registry";

export function MiniGameSetup({
  definition,
  /** One or two lines telling a child what the game is, in their words. */
  howToPlay,
}: {
  definition: MiniGameDefinition;
  howToPlay: string;
}) {
  const game = getGame(definition.id);
  const { profile } = usePlayerProfile();
  const state = profile.games[definition.id];

  const [packId, setPackId] = useState<ContentPackId>(() =>
    coercePack(definition, state.lastSetup?.packId),
  );
  const [level, setLevel] = useState<MiniLearningLevel>(() =>
    coerceLevel(definition, state.lastSetup?.level),
  );

  const availablePacks = packsFor(definition);
  const packs = listContentPacks().filter((pack) =>
    availablePacks.includes(pack.id),
  );
  const levels = MINI_LEARNING_LEVELS.filter((entry) =>
    definition.levels.includes(entry.id),
  );
  const record = getMiniRecordFrom(state, packId, level);

  const handlePack = (id: ContentPackId) => {
    setPackId(id);
    emitMiniGameEvent({
      name: "category_selected",
      gameId: definition.id,
      packId: id,
      level,
    });
  };

  const handleLevel = (id: MiniLearningLevel) => {
    setLevel(id);
    emitMiniGameEvent({
      name: "difficulty_selected",
      gameId: definition.id,
      packId,
      level: id,
    });
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#8fd8f5] via-[#bfeafb] to-[#eaf8e6]">
      <PlatformHeader
        eyebrow="Quick Play"
        title={
          <>
            {game.glyph} {game.displayName}
          </>
        }
        coins={spendableCoins(profile)}
        streak={profile.currentStreak}
        backHref="/"
        backLabel="← Games"
      />

      <div className="mx-auto max-w-2xl px-4 pt-5 pb-28">
        <section className="rounded-[1.5rem] border-4 border-white bg-white/90 p-4 shadow-lg">
          <p className="text-lg leading-snug font-black text-[#141420]">
            {howToPlay}
          </p>
          <p className="mt-1 text-sm font-bold text-[#6b6b80]">
            About {definition.sessionLabel}.
          </p>
        </section>

        <h2 className="mt-6 mb-2 text-xs font-black tracking-[0.22em] text-[#3c5a68] uppercase">
          Pick a pack
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {packs.map((pack) => {
            const selected = pack.id === packId;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => handlePack(pack.id)}
                aria-pressed={selected}
                className={`overflow-hidden rounded-2xl border-4 text-left shadow-md transition-transform active:scale-95 ${
                  selected ? "border-[#141420] bg-white" : "border-white bg-white/70"
                }`}
              >
                <div
                  className={`flex h-16 items-center justify-center bg-gradient-to-br ${pack.gradient}`}
                >
                  <span className="text-3xl drop-shadow" aria-hidden>
                    {pack.glyph}
                  </span>
                </div>
                <p className="px-2 py-2 text-sm leading-tight font-black text-[#141420]">
                  {pack.title}
                </p>
              </button>
            );
          })}
        </div>

        <h2 className="mt-6 mb-2 text-xs font-black tracking-[0.22em] text-[#3c5a68] uppercase">
          Pick a level
        </h2>
        <div className="grid gap-2">
          {levels.map((entry) => {
            const selected = entry.id === level;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => handleLevel(entry.id)}
                aria-pressed={selected}
                className={`flex items-center gap-3 rounded-2xl border-4 p-3 text-left shadow-md transition-transform active:scale-[0.98] ${
                  selected ? "border-[#141420] bg-white" : "border-white bg-white/70"
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {entry.glyph}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg leading-tight font-black text-[#141420]">
                    {entry.label}
                    <span className="ml-2 text-xs font-black tracking-widest text-[#8a8aa0] uppercase">
                      {entry.kicker}
                    </span>
                  </span>
                  <span className="block text-sm font-semibold text-[#6b6b80]">
                    {entry.blurb}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {record.plays > 0 ? (
          <section className="mt-5 rounded-2xl border-4 border-white bg-white/85 p-4 shadow-md">
            <p className="text-xs font-black tracking-widest text-[#8a8aa0] uppercase">
              Your best on {getContentPack(packId).title}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
              <p className="text-2xl font-black text-[#141420] tabular-nums">
                {record.bestScore}
                <span className="ml-1 text-xs font-black text-[#8a8aa0] uppercase">
                  points
                </span>
              </p>
              <p className="text-2xl font-black text-[#141420] tabular-nums">
                {record.bestCombo}
                <span className="ml-1 text-xs font-black text-[#8a8aa0] uppercase">
                  best combo
                </span>
              </p>
              <p className="text-2xl font-black text-[#141420] tabular-nums">
                {record.plays}
                <span className="ml-1 text-xs font-black text-[#8a8aa0] uppercase">
                  played
                </span>
              </p>
            </div>
          </section>
        ) : null}
      </div>

      {/* Pinned so PLAY is always reachable with a thumb, whatever the
          scroll position — a phone-first rule, not a decorative one. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t-4 border-white/60 bg-white/85 p-3 backdrop-blur">
        <Link
          href={`${game.route}/play?pack=${packId}&level=${level}`}
          onClick={() => miniAudio.unlock()}
          className="mx-auto block w-full max-w-2xl rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-center text-2xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
        >
          PLAY
        </Link>
      </div>
    </main>
  );
}
