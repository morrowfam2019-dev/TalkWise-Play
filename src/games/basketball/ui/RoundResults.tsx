"use client";

import { CoinIcon } from "@/ui/CoinIcon";
import type { RoundSummary } from "../core/round";

export function RoundResults({
  summary,
  totalShots,
  isNewBest,
  previousBest,
  onPlayAgain,
  onChangeSound,
  onExit,
}: {
  summary: RoundSummary;
  totalShots: number;
  isNewBest: boolean;
  previousBest: number;
  onPlayAgain: () => void;
  onChangeSound: () => void;
  onExit: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-[#141420]/85 p-4 backdrop-blur-sm">
      <div className="tw-pop w-full max-w-sm rounded-[2rem] border-8 border-[#f5c33b] bg-white p-7 text-center shadow-2xl">
        <p className="text-sm font-black tracking-[0.2em] text-[#8a8aa0] uppercase">
          Speech Shootout
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-[#141420]">
          🏀 Complete!
        </h1>

        {isNewBest ? (
          <p className="mt-3 rounded-full bg-[#fff4d6] px-4 py-2 text-sm font-black text-[#b8860b]">
            🏆 New high score!
          </p>
        ) : (
          <p className="mt-3 text-xs font-semibold text-[#8a8aa0]">
            Best on this sound: {previousBest}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#f3f4f8] p-4">
            <p className="text-2xl font-black text-[#141420]">
              {summary.wordsCompleted}/{totalShots}
            </p>
            <p className="mt-1 text-[0.65rem] font-bold tracking-wide text-[#6b6b80] uppercase">
              Speech Words
            </p>
          </div>
          <div className="rounded-2xl bg-[#eaf4ff] p-4">
            <p className="text-2xl font-black text-[#2f7fd4]">
              {summary.basketsMade}/{totalShots}
            </p>
            <p className="mt-1 text-[0.65rem] font-bold tracking-wide text-[#6b6b80] uppercase">
              Baskets
            </p>
          </div>
          <div className="rounded-2xl bg-[#e6f9ee] p-4">
            <p className="text-2xl font-black text-[#2ecc71]">
              {summary.basketballScore}
            </p>
            <p className="mt-1 text-[0.65rem] font-bold tracking-wide text-[#6b6b80] uppercase">
              Score
            </p>
          </div>
          <div className="rounded-2xl bg-[#fff8e6] p-4">
            <p className="flex items-center justify-center gap-1.5 text-2xl font-black text-[#b8860b]">
              <CoinIcon className="h-5 w-5" />
              {summary.coinsEarned}
            </p>
            <p className="mt-1 text-[0.65rem] font-bold tracking-wide text-[#6b6b80] uppercase">
              Coins Earned
            </p>
          </div>
        </div>

        {summary.bestStreak >= 3 ? (
          <p className="mt-3 rounded-full bg-[#ff8a3d] px-4 py-2 text-sm font-black text-white">
            {summary.bestStreak >= 5 ? "⭐ All-Star streak: " : "🔥 Hot streak: "}
            {summary.bestStreak} in a row
          </p>
        ) : null}

        <button
          type="button"
          onClick={onPlayAgain}
          className="mt-6 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-4 text-xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
        >
          PLAY AGAIN
        </button>
        <button
          type="button"
          onClick={onChangeSound}
          className="mt-3 w-full rounded-2xl border-4 border-[#f5c33b] bg-[#fff8e6] px-6 py-3 text-base font-black text-[#b8860b]"
        >
          CHANGE SOUND
        </button>
        <button
          type="button"
          onClick={onExit}
          className="mt-2 w-full rounded-xl px-4 py-2 text-sm font-bold text-[#8a8aa0] hover:text-[#141420]"
        >
          Back to TalkWise Play
        </button>
      </div>
    </div>
  );
}
