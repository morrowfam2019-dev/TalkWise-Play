"use client";

import { CoinIcon } from "@/ui/CoinIcon";

interface MapCelebrationProps {
  mapTitle: string;
  litStations: number;
  coins: number;
  onKeepExploring: () => void;
  onExit: () => void;
}

/**
 * Shown the first time every station on a map has been lit.
 *
 * It is a party, not a report card: no percentage, no accuracy, no "level
 * complete" that implies the park is now finished. The primary button keeps
 * the child in the map, because the map is still there and still fun and
 * they may well want to go back to the swings.
 */
export function MapCelebration({
  mapTitle,
  litStations,
  coins,
  onKeepExploring,
  onExit,
}: MapCelebrationProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${mapTitle} is all lit up`}
      className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-[#141420]/80 p-4 backdrop-blur-sm"
    >
      <div className="tw-pop w-full max-w-sm rounded-[2rem] border-8 border-[#f5c33b] bg-white p-7 text-center shadow-2xl">
        <div className="flex justify-center gap-2 text-5xl" aria-hidden>
          <span className="tw-star" style={{ animationDelay: "0ms" }}>
            🎉
          </span>
          <span className="tw-star" style={{ animationDelay: "120ms" }}>
            ✨
          </span>
          <span className="tw-star" style={{ animationDelay: "240ms" }}>
            🎊
          </span>
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[#141420]">
          {mapTitle} is all lit up!
        </h2>
        <p className="mt-2 text-lg font-bold text-[#4a4a60]">
          You lit {litStations} {litStations === 1 ? "sound" : "sounds"}.
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#fff4d6] px-5 py-2 text-2xl font-black text-[#b8860b]">
          {coins}
          <CoinIcon className="h-6 w-6" />
        </p>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={onKeepExploring}
            className="w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-2xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
          >
            🧭 KEEP EXPLORING
          </button>
          <button
            type="button"
            onClick={onExit}
            className="w-full rounded-2xl border-4 border-[#e2e4ee] px-6 py-4 text-xl font-black text-[#4a4a60]"
          >
            🗺️ ANOTHER MAP
          </button>
        </div>
      </div>
    </div>
  );
}
