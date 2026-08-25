"use client";

import { useEffect, useState } from "react";
import { CoinIcon } from "@/ui/CoinIcon";

interface ExplorerHudProps {
  litStations: number;
  totalStations: number;
  coins: number;
  /** The grapheme of the station the player is standing next to, if any. */
  nearDisplay: string | null;
  nearPlace: string | null;
  muted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
}

/**
 * Explorer HUD.
 *
 * Even lighter than the word adventures' — there is no objective to track
 * and no timer, so the only things on screen are how many stations have been
 * lit, the coin count, and a bubble when a station is within reach. The
 * bubble leads with the letter rather than a sentence, because the player it
 * is for cannot read one.
 */
export function ExplorerHud({
  litStations,
  totalStations,
  coins,
  nearDisplay,
  nearPlace,
  muted,
  onToggleMute,
  onExit,
}: ExplorerHudProps) {
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowHint(false), 11000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
        <div className="pointer-events-auto rounded-2xl border-4 border-white/70 bg-[#141420]/85 px-3 py-2 shadow-lg backdrop-blur-sm sm:px-4">
          <div className="flex items-center gap-1.5 text-base font-extrabold text-white sm:text-lg">
            <span aria-hidden>✨</span>
            <span className="tabular-nums" data-testid="hud-stations">
              {litStations} / {totalStations}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border-4 border-white/70 bg-[#141420]/85 px-3 py-2 text-base font-extrabold shadow-lg backdrop-blur-sm sm:px-4 sm:text-lg">
            <CoinIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="tabular-nums text-white" data-testid="hud-coins">
              {coins}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? "Turn sound on" : "Turn sound off"}
              className="pointer-events-auto grid h-12 w-12 place-items-center rounded-2xl border-4 border-white/70 bg-[#141420]/85 text-xl shadow-lg backdrop-blur-sm active:scale-95"
            >
              <span aria-hidden>{muted ? "🔇" : "🔊"}</span>
            </button>
            <button
              type="button"
              onClick={onExit}
              aria-label="Back to Sound Explorer"
              className="pointer-events-auto grid h-12 w-12 place-items-center rounded-2xl border-4 border-white/70 bg-[#141420]/85 text-xl shadow-lg backdrop-blur-sm active:scale-95"
            >
              <span aria-hidden>🏠</span>
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center px-4 sm:top-28">
        {nearDisplay ? (
          <div className="flex animate-pulse items-center gap-3 rounded-full border-4 border-[#f5c33b] bg-white px-5 py-2 shadow-xl">
            <span className="text-3xl font-black text-[#141420]">
              {nearDisplay}
            </span>
            <span className="text-base font-extrabold text-[#4a4a60]">
              {nearPlace}
            </span>
          </div>
        ) : null}
      </div>

      {showHint ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-48 flex justify-center px-4 sm:bottom-6">
          <p className="rounded-full bg-[#141420]/75 px-4 py-2 text-center text-sm font-bold text-white/90 backdrop-blur-sm">
            <span className="hidden sm:inline">
              WASD or arrows to move · drag to look · space to jump · walk to a
              glowing letter
            </span>
            <span className="sm:hidden">
              👆 Move with the stick · walk to a glowing letter
            </span>
          </p>
        </div>
      ) : null}
    </>
  );
}
