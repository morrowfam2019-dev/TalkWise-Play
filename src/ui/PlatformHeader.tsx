"use client";

import Link from "next/link";
import { CoinIcon } from "@/ui/CoinIcon";

/**
 * The TalkWise Play chrome that sits above every screen — platform brand,
 * the shared coin wallet, and the practice streak.
 *
 * Deliberately platform-level: the wallet and streak belong to the child,
 * not to whichever game they happen to be inside, so the same header is
 * correct on the library, in Adventures, and on the basketball court.
 */
export function PlatformHeader({
  eyebrow,
  title,
  accent,
  coins,
  streak,
  backHref,
  backLabel = "← Back",
}: {
  /** Small label above the title, e.g. the game's name. */
  eyebrow: string;
  title: React.ReactNode;
  /** Tailwind text colour class for the title's highlighted half. */
  accent?: string;
  coins: number;
  streak?: number;
  /** Omit to hide the back button (the library itself has nowhere to go). */
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="bg-[#141420] px-5 py-4 shadow-lg">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[0.65rem] font-black tracking-[0.28em] uppercase ${
              accent ?? "text-[#f5c33b]"
            }`}
          >
            {eyebrow}
          </p>
          <h1 className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {streak && streak > 0 ? (
            <div className="hidden rounded-2xl border-2 border-[#ff8a3d]/40 bg-white/5 px-3 py-2 text-right sm:block">
              <p className="text-[0.6rem] font-bold tracking-widest text-white/60 uppercase">
                Streak
              </p>
              <p className="text-xl font-black text-[#ff8a3d] tabular-nums">
                🔥 {streak}
              </p>
            </div>
          ) : null}
          <div className="rounded-2xl border-2 border-[#f5c33b]/40 bg-white/5 px-3 py-2 text-right">
            <p className="text-[0.6rem] font-bold tracking-widest text-white/60 uppercase">
              Coins
            </p>
            <p className="flex items-center justify-end gap-1.5 text-xl font-black text-[#f5c33b] tabular-nums">
              <CoinIcon className="h-5 w-5" />
              {coins}
            </p>
          </div>
          {backHref ? (
            <Link
              href={backHref}
              className="rounded-xl border-2 border-white/30 px-3 py-2 text-sm font-black text-white"
            >
              {backLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
