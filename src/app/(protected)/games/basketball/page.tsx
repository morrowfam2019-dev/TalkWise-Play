"use client";

import Link from "next/link";
import { getBaller, getJersey } from "@/content/basketball/roster";
import { listBasketballModes } from "@/games/basketball/modes/registry";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { PlatformHeader } from "@/ui/PlatformHeader";

/**
 * GAME-002 Speech Basketball — the game's own front door.
 *
 * Choose a mode, then a sound, then a difficulty. Deliberately not folded
 * into the Adventures screens: this is an independent game with its own
 * identity, its own store, its own characters and its own records inside the
 * same TalkWise Play account. No Adventure navigation and no Adventure shop
 * items appear here.
 */
export default function BasketballHome() {
  // Only GAME-002's namespace is read here.
  const { profile, basketball } = usePlayerProfile();
  const baller = getBaller(basketball.loadout.ballerId);
  const jersey = getJersey(basketball.loadout.jerseyId);
  const modes = listBasketballModes();

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
            Shop
          </Link>
        </div>

        <h2 className="mt-8 mb-3 text-xs font-black tracking-[0.22em] text-[#3c2a12] uppercase">
          Choose a mode
        </h2>

        <div className="grid gap-4">
          {modes.map((mode) => {
            const comingSoon = mode.status === "coming-soon";
            const card = (
              <>
                <div
                  className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-3xl ${mode.cardGradient}`}
                  aria-hidden
                >
                  {mode.glyph}
                </div>
                <div className="flex-1">
                  <p className="text-[0.65rem] font-black tracking-[0.22em] text-[#8a8aa0] uppercase">
                    {mode.number} — {mode.kicker}
                  </p>
                  <p className="text-xl font-black tracking-tight text-[#141420]">
                    {mode.title}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[#6b6b80]">
                    {mode.blurb}
                  </p>
                </div>
                {comingSoon ? (
                  <span className="rounded-full bg-[#eceef6] px-3 py-1 text-[0.65rem] font-black tracking-wide text-[#8a8aa0] uppercase">
                    Soon
                  </span>
                ) : (
                  <span className="text-2xl" aria-hidden>
                    ▶
                  </span>
                )}
              </>
            );

            if (comingSoon) {
              return (
                <div
                  key={mode.id}
                  aria-disabled
                  className="flex items-center gap-4 rounded-[1.5rem] border-4 border-white/60 bg-white/50 p-4 opacity-80 shadow"
                >
                  {card}
                </div>
              );
            }

            return (
              <Link
                key={mode.id}
                href={`/games/basketball/${mode.slug}`}
                className="flex items-center gap-4 rounded-[1.5rem] border-4 border-white bg-white/90 p-4 shadow-lg transition-transform active:translate-y-0.5"
              >
                {card}
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
