"use client";

import { CoinIcon } from "@/ui/CoinIcon";

export function RoundHud({
  shotNumber,
  totalShots,
  basketballScore,
  coinsEarned,
  streak,
  spotLabel,
  onExit,
}: {
  shotNumber: number;
  totalShots: number;
  basketballScore: number;
  coinsEarned: number;
  streak: number;
  spotLabel: string;
  onExit: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
      <div className="pointer-events-auto rounded-2xl border-4 border-white/70 bg-[#141420]/85 px-3 py-2 shadow-lg backdrop-blur-sm sm:px-4">
        <div className="flex items-center gap-2 text-base font-extrabold text-white sm:text-lg">
          🏀
          <span className="tabular-nums">
            {shotNumber} / {totalShots}
          </span>
        </div>
        <p className="mt-0.5 text-xs font-bold text-[#f5c33b] uppercase tracking-wide">
          {spotLabel}
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border-4 border-white/70 bg-[#141420]/85 px-3 py-2 shadow-lg backdrop-blur-sm sm:px-4">
          <span className="text-base font-extrabold text-white sm:text-lg">
            ⭐ <span className="tabular-nums">{basketballScore}</span>
          </span>
          <span className="flex items-center gap-1 text-base font-extrabold text-[#f5c33b] sm:text-lg">
            <CoinIcon className="h-4 w-4" />
            <span className="tabular-nums">{coinsEarned}</span>
          </span>
        </div>
        {streak >= 3 ? (
          <p className="pointer-events-auto rounded-full bg-[#ff8a3d] px-3 py-1.5 text-xs font-black text-white shadow-lg">
            {streak >= 5 ? "⭐ ALL-STAR STREAK" : "🔥 HOT STREAK"}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onExit}
          aria-label="Back to TalkWise Play"
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-2xl border-4 border-white/70 bg-[#141420]/85 text-lg shadow-lg backdrop-blur-sm active:scale-95"
        >
          🏠
        </button>
      </div>
    </div>
  );
}
