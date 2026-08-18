"use client";

import Link from "next/link";
import { getBaller, getJersey } from "@/content/basketball/roster";
import { listLevels } from "@/content/speech";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { PlatformHeader } from "@/ui/PlatformHeader";

/**
 * GAME-002 Speech Basketball — the game's own front door.
 *
 * Choose a sound, see your baller, tip off. Deliberately not folded into the
 * Adventures screens: this is an independent game with its own identity,
 * its own store, and its own records inside the same TalkWise Play account.
 */
export default function BasketballHome() {
  // Only GAME-002's namespace is read here.
  const { profile, basketball } = usePlayerProfile();
  const levels = listLevels();
  const baller = getBaller(basketball.loadout.ballerId);
  const jersey = getJersey(basketball.loadout.jerseyId);

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#ffdcae] via-[#ffb877] to-[#c98a4b]">
      <PlatformHeader
        eyebrow="TalkWise Play"
        title={
          <>
            🏀 Speech <span className="text-[#f5c33b]">Basketball</span>
          </>
        }
        coins={spendableCoins(profile)}
        streak={profile.currentStreak}
        backHref="/"
        backLabel="← Games"
      />

      <div className="mx-auto max-w-3xl px-5 pt-6 pb-16">
        <div className="flex items-center gap-4 rounded-[1.5rem] border-4 border-white bg-white/85 p-4 shadow-lg backdrop-blur-sm">
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-2xl"
            style={{ background: baller.look.skin }}
            aria-hidden
          >
            🏀
          </div>
          <div className="flex-1">
            <p className="text-lg font-black tracking-tight text-[#141420]">
              Playing as {baller.name}
            </p>
            <p className="text-sm font-semibold text-[#6b6b80]">
              Wearing {jersey?.name ?? "no jersey"}
            </p>
          </div>
          <Link
            href="/games/basketball/shop"
            className="rounded-xl border-2 border-[#141420]/20 bg-white px-4 py-2 text-sm font-black text-[#141420]"
          >
            Change
          </Link>
        </div>

        <h2 className="mt-8 mb-3 text-xs font-black tracking-[0.22em] text-[#3c2a12] uppercase">
          Choose a sound
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {levels.map((level) => {
            const best = basketball.highScores[level.sound.id];
            return (
              <Link
                key={level.id}
                href={`/games/basketball/play/${level.sound.id}`}
                className="flex items-center gap-4 rounded-[1.5rem] border-4 border-white bg-white/90 p-4 shadow-lg transition-transform active:translate-y-0.5"
              >
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#fff4d6] text-xl font-black text-[#b8860b]">
                  {level.sound.label}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-black tracking-tight text-[#141420]">
                    {level.sound.label} Shootout
                  </p>
                  <p className="text-sm font-semibold text-[#6b6b80]">
                    {best && best.bestScore > 0
                      ? `Best score: ${best.bestScore}`
                      : "10 shots · Rookie"}
                  </p>
                </div>
                <span className="text-2xl" aria-hidden>
                  🏀
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link href="/" className="text-xs font-bold text-[#3c2a12] underline">
            ← Back to TalkWise Play
          </Link>
        </div>
      </div>
    </main>
  );
}
