"use client";

import Link from "next/link";
import { getBasketballMode } from "@/games/basketball/modes/registry";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { PlatformHeader } from "@/ui/PlatformHeader";

/**
 * MODE 03 — 1-on-1 Clutch. Coming Soon.
 *
 * The mode is not playable and this screen does not pretend otherwise. It
 * exists so the card on the mode-select screen leads somewhere honest rather
 * than being dead, and so the route is already the one the finished mode will
 * live at.
 */
export default function ClutchPage() {
  const { profile } = usePlayerProfile();
  const mode = getBasketballMode("clutch");

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#ffdcae] via-[#ffb877] to-[#c98a4b]">
      <PlatformHeader
        eyebrow="Speech Basketball"
        title={
          <>
            {mode.glyph} {mode.title}
          </>
        }
        coins={spendableCoins(profile)}
        streak={profile.currentStreak}
        backHref="/games/basketball"
        backLabel="← Modes"
      />

      <div className="mx-auto max-w-lg px-5 pt-10 pb-16 text-center">
        <div className="rounded-[2rem] border-8 border-white bg-white/90 p-8 shadow-xl">
          <p className="text-6xl" aria-hidden>
            🛡️
          </p>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-[#141420]">
            In training
          </h1>
          <p className="mt-3 text-sm font-semibold text-[#6b6b80]">
            1-on-1 Clutch is still practising. Face a defender, say your target
            under the shot clock, and take the shot — coming to Speech
            Basketball soon.
          </p>
          <Link
            href="/games/basketball/time-attack"
            className="mt-6 inline-block w-full rounded-2xl border-b-8 border-[#2f6fd4] bg-[#4ac1ff] px-6 py-4 text-lg font-black text-white shadow-lg"
          >
            Play Time Attack instead
          </Link>
          <Link
            href="/games/basketball"
            className="mt-4 inline-block text-xs font-bold text-[#3c2a12] underline"
          >
            ← Back to Speech Basketball
          </Link>
        </div>
      </div>
    </main>
  );
}
