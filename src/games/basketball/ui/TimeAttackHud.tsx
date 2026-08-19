"use client";

import { BONUS_WINDOW_SECONDS } from "../core/arcade";

/**
 * Time Attack's heads-up display: clock, score, streak.
 *
 * Everything here is `pointer-events-none` except the exit button, because
 * the entire rest of the screen is a drag surface. A HUD element that
 * swallowed a touch would eat a shot.
 */
export function TimeAttackHud({
  secondsRemaining,
  score,
  streak,
  onExit,
}: {
  secondsRemaining: number;
  score: number;
  streak: number;
  onExit: () => void;
}) {
  const urgent = secondsRemaining <= 5;
  const bonus = secondsRemaining <= BONUS_WINDOW_SECONDS;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="pointer-events-auto rounded-xl border-2 border-white/60 bg-white/85 px-3 py-2 text-xs font-black text-[#141420] shadow"
        >
          ← Quit
        </button>

        <div
          className={`rounded-2xl border-4 px-5 py-2 text-center shadow-lg tabular-nums ${
            urgent
              ? "tw-pop border-[#e5342f] bg-[#ffe9e8]"
              : "border-white bg-white/90"
          }`}
        >
          <p className="text-[0.6rem] font-black tracking-[0.2em] text-[#8a8aa0] uppercase">
            Time
          </p>
          <p
            className={`text-4xl leading-none font-black ${
              urgent ? "text-[#e5342f]" : "text-[#141420]"
            }`}
            aria-live="off"
          >
            {Math.max(0, Math.ceil(secondsRemaining))}
          </p>
        </div>

        <div className="rounded-2xl border-4 border-white bg-white/90 px-4 py-2 text-center shadow-lg tabular-nums">
          <p className="text-[0.6rem] font-black tracking-[0.2em] text-[#8a8aa0] uppercase">
            Score
          </p>
          <p className="text-3xl leading-none font-black text-[#141420]">
            {score}
          </p>
        </div>
      </div>

      <div className="mt-2 flex justify-center gap-2">
        {bonus ? (
          <span className="rounded-full bg-[#f5c33b] px-3 py-1 text-[0.65rem] font-black tracking-wide text-[#3c2a12] uppercase shadow">
            ⭐ Bonus time — baskets are worth 3
          </span>
        ) : null}
        {streak >= 2 ? (
          <span className="rounded-full bg-[#ff8a3d] px-3 py-1 text-[0.65rem] font-black tracking-wide text-white uppercase shadow">
            🔥 {streak} in a row
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** The 3 → 2 → 1 → GO! lead-in before the clock starts. */
export function ArcadeCountdown({ value }: { value: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
      <div
        key={value}
        className="tw-pop rounded-full border-8 border-[#f5c33b] bg-white/95 px-12 py-8 text-center shadow-2xl"
      >
        <p className="text-7xl font-black text-[#141420]">
          {value > 0 ? value : "GO!"}
        </p>
      </div>
    </div>
  );
}

/** Streak celebration. Deliberately small and high on the screen so it never
 * covers the rack or the hoop while the child is shooting. */
export function StreakBanner({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-32 z-10 flex justify-center">
      <p className="tw-pop rounded-2xl bg-[#ff8a3d] px-5 py-2 text-2xl font-black tracking-wide text-white shadow-lg">
        {label}
      </p>
    </div>
  );
}
