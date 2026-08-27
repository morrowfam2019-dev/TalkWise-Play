"use client";

/**
 * The in-play HUD every mini-game wears.
 *
 * Four things, no more: score, combo, the clock or round counter, and a way
 * out. §11 rules out excessive menus and text-heavy chrome, and a pre-K
 * player reads none of it anyway — the combo pill and the clock exist to be
 * *glanced* at, which is why they are colour and size before they are text.
 *
 * The exit is a two-step confirm rather than an instant quit. A child whose
 * thumb brushes a corner button should not lose their round, and §16's
 * touch-safety brief applies to leaving a game as much as to playing it.
 */

import { useState } from "react";
import { CoinIcon } from "@/ui/CoinIcon";

export function MiniGameHud({
  score,
  combo,
  multiplier,
  /** Whole seconds left, for timed games. */
  secondsRemaining,
  /** "3 of 8", for round-based games. Ignored when a clock is shown. */
  roundLabel,
  coins,
  onExit,
}: {
  score: number;
  combo: number;
  multiplier: number;
  secondsRemaining?: number;
  roundLabel?: string;
  coins: number;
  onExit: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const urgent = secondsRemaining !== undefined && secondsRemaining <= 5;

  return (
    <>
      <header className="relative z-30 flex items-center gap-2 bg-[#141420]/90 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label="Leave this game"
          className="rounded-xl border-2 border-white/30 px-3 py-2 text-sm font-black text-white"
        >
          ✕
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="text-[0.55rem] font-black tracking-[0.24em] text-white/50 uppercase">
            Score
          </p>
          <p className="text-2xl leading-none font-black text-white tabular-nums">
            {score}
          </p>
        </div>

        {multiplier > 1 ? (
          <div className="tw-pop rounded-full border-2 border-[#f5c33b] bg-[#f5c33b]/20 px-3 py-1.5">
            <p className="text-lg leading-none font-black text-[#f5c33b] tabular-nums">
              x{multiplier}
            </p>
            <p className="text-[0.5rem] font-black tracking-widest text-white/60 uppercase">
              {combo} in a row
            </p>
          </div>
        ) : null}

        {secondsRemaining !== undefined ? (
          <div
            className={`rounded-2xl border-2 px-3 py-1.5 text-right ${
              urgent
                ? "border-[#f0483d] bg-[#f0483d]/25"
                : "border-white/25 bg-white/5"
            }`}
          >
            <p className="text-[0.5rem] font-black tracking-widest text-white/60 uppercase">
              Time
            </p>
            <p
              className={`text-2xl leading-none font-black tabular-nums ${
                urgent ? "text-[#ff8a8a]" : "text-white"
              }`}
            >
              {secondsRemaining}
            </p>
          </div>
        ) : roundLabel ? (
          <div className="rounded-2xl border-2 border-white/25 bg-white/5 px-3 py-1.5 text-right">
            <p className="text-[0.5rem] font-black tracking-widest text-white/60 uppercase">
              Round
            </p>
            <p className="text-lg leading-none font-black text-white tabular-nums">
              {roundLabel}
            </p>
          </div>
        ) : null}

        <div className="hidden items-center gap-1 rounded-2xl border-2 border-[#f5c33b]/40 bg-white/5 px-3 py-2 sm:flex">
          <CoinIcon className="h-4 w-4" />
          <span className="text-lg font-black text-[#f5c33b] tabular-nums">
            {coins}
          </span>
        </div>
      </header>

      {confirming ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#141420]/70 p-4 backdrop-blur-sm">
          <div className="tw-pop w-full max-w-xs rounded-[1.75rem] border-8 border-[#f5c33b] bg-white p-5 text-center shadow-2xl">
            <p className="text-2xl font-black text-[#141420]">Stop playing?</p>
            <p className="mt-1 text-sm font-semibold text-[#6b6b80]">
              You can come back any time.
            </p>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="mt-4 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-4 py-4 text-xl font-black text-white"
            >
              KEEP PLAYING
            </button>
            <button
              type="button"
              onClick={() => {
                // Close this dialog *before* handing off. `onExit` swaps the
                // game out for the results screen underneath, but this card
                // owns its own visibility — without clearing it here it stays
                // stranded on top of the results, and the only way past it is
                // KEEP PLAYING, which reads as the button having done nothing.
                setConfirming(false);
                onExit();
              }}
              className="mt-2 w-full rounded-xl border-2 border-[#e2e4ee] px-4 py-3 text-sm font-black text-[#4a4a60]"
            >
              Stop and see my score
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
