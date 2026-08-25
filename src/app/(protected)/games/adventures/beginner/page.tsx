"use client";

import Link from "next/link";
import {
  getBeginnerGroup,
  getBeginnerSound,
} from "@/content/speech/beginner";
import { listExplorerMaps } from "@/games/adventures/explorer/maps";
import { getMapProgress } from "@/player/storage";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { PlatformHeader } from "@/ui/PlatformHeader";

/**
 * GAME-001 BEGINNER — Sound Explorer map select.
 *
 * Three big worlds, none of them locked. The order on screen is the order
 * the sound groups are typically acquired, so there is an obvious place to
 * start — but a child who is ready for Rainbow Ridge on day one walks
 * straight into it. Nothing here tells a family what their child should be
 * able to do.
 *
 * Built for a pre-reader looking over a grown-up's shoulder: each card leads
 * with its sounds as big letters, and the button is one word.
 */
export default function BeginnerHome() {
  const { profile } = usePlayerProfile();
  const maps = listExplorerMaps();

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#ffe9a8] via-[#ffd76a] to-[#ffeccd]">
      <PlatformHeader
        eyebrow="Speech Adventures · Beginner"
        title={
          <>
            Sound <span className="text-[#ffd76a]">Explorer</span>
          </>
        }
        coins={spendableCoins(profile)}
        streak={profile.currentStreak}
        backHref="/games/adventures"
        backLabel="← Levels"
      />

      <div className="mx-auto max-w-3xl px-5 pt-6 pb-16">
        <p className="rounded-[1.5rem] border-4 border-white bg-white/85 p-5 text-base font-semibold text-[#4a4a60] shadow-lg backdrop-blur-sm">
          Explore a big world, find the glowing letters, and make each sound
          out loud. Miss Maya shows you how at every stop.
        </p>

        <h2 className="mt-8 mb-3 text-xs font-black tracking-[0.22em] text-[#7a5a12] uppercase">
          Choose your world
        </h2>

        <div className="grid gap-5">
          {maps.map((map) => {
            const group = getBeginnerGroup(map.groupId);
            const saved = getMapProgress(profile, map.id);
            const lit = map.stations.filter((station) => {
              const sound = getBeginnerSound(station.soundId);
              const record = saved.stations[station.soundId];
              if (!sound || !record) return false;
              return record.completions >= sound.repetitions;
            }).length;

            return (
              <article
                key={map.id}
                className="overflow-hidden rounded-[1.5rem] border-4 border-white bg-white shadow-xl"
              >
                <div
                  className={`relative flex h-36 items-center justify-center gap-3 bg-gradient-to-br ${map.cardGradient}`}
                >
                  {map.stations.map((station) => {
                    const sound = getBeginnerSound(station.soundId);
                    return (
                      <span
                        key={station.id}
                        className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-white/70 bg-white/25 text-5xl font-black text-white drop-shadow-lg"
                      >
                        {sound?.display ?? "?"}
                      </span>
                    );
                  })}
                  <span className="absolute top-3 right-4 text-3xl" aria-hidden>
                    {map.glyph}
                  </span>
                  {lit === map.stations.length && lit > 0 ? (
                    <span className="absolute top-3 left-4 rounded-full bg-white px-3 py-1 text-xs font-black text-[#2ecc71]">
                      ★ ALL LIT
                    </span>
                  ) : null}
                </div>

                <div className="p-5">
                  <h3 className="text-2xl font-black tracking-tight text-[#141420]">
                    {map.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-[#4a4a60]">
                    {map.blurb}
                  </p>
                  {group ? (
                    <p className="mt-2 inline-block rounded-full bg-[#fff4d6] px-3 py-1 text-xs font-black text-[#8a6a12]">
                      {group.glyph} {group.title}
                    </p>
                  ) : null}

                  <p className="mt-3 rounded-lg bg-[#f3f4f8] px-3 py-1.5 text-xs font-bold text-[#4a4a60]">
                    {lit} / {map.stations.length} sounds lit up
                  </p>

                  <Link
                    href={`/games/adventures/beginner/${map.id}`}
                    className="mt-4 block w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-center text-2xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
                  >
                    ▶ EXPLORE
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-8 rounded-2xl border-4 border-white/70 bg-white/60 p-4 text-center text-xs font-semibold text-[#7a5a12]">
          The worlds are grouped by how speech sounds usually develop, so
          there is an easy place to begin — but every world is open from the
          start, and children pick sounds up in their own order.
        </p>

        <div className="mt-8 text-center">
          <Link
            href="/games/adventures"
            className="text-xs font-bold text-[#7a5a12] underline"
          >
            ← Back to Speech Adventures
          </Link>
        </div>
      </div>
    </main>
  );
}
