"use client";

import { CoinIcon } from "@/ui/CoinIcon";
import type { TimeAttackSummary } from "../core/arcade";

/**
 * End-of-round card for Time Attack.
 *
 * Scrollable rather than fixed: it carries five buttons plus six stats, which
 * on a short phone in landscape does not fit a viewport-height flex centre.
 */
export function TimeAttackResults({
  summary,
  coinsEarned,
  personalBest,
  isNewBest,
  reducedReward,
  onPlayAgain,
  onChangeSound,
  onChangeDifficulty,
  onBackToBasketball,
  onExit,
}: {
  summary: TimeAttackSummary;
  coinsEarned: number;
  /** Best score for this sound + difficulty, including this round. */
  personalBest: number;
  isNewBest: boolean;
  /** True when the daily diminishing-returns multiplier reduced the payout. */
  reducedReward: boolean;
  onPlayAgain: () => void;
  onChangeSound: () => void;
  onChangeDifficulty: () => void;
  onBackToBasketball: () => void;
  onExit: () => void;
}) {
  const stats: [string, string][] = [
    ["Baskets Made", String(summary.basketsMade)],
    ["Shots Taken", String(summary.shotsTaken)],
    ["Accuracy", `${summary.accuracy}%`],
    ["Best Streak", String(summary.bestStreak)],
  ];

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 overflow-y-auto bg-[#141420]/85 p-4 backdrop-blur-sm">
      <div className="tw-pop mx-auto my-auto w-full max-w-sm rounded-[2rem] border-8 border-[#f5c33b] bg-white p-7 text-center shadow-2xl">
        <p className="text-sm font-black tracking-[0.2em] text-[#8a8aa0] uppercase">
          Time Attack
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-[#141420]">
          ⏱️ Complete!
        </h1>

        <p className="mt-4 text-6xl font-black text-[#141420] tabular-nums">
          {summary.score}
        </p>
        <p className="text-xs font-black tracking-[0.2em] text-[#8a8aa0] uppercase">
          Score
        </p>

        {isNewBest ? (
          <p className="mt-3 rounded-full bg-[#fff4d6] px-4 py-2 text-sm font-black text-[#b8860b]">
            🏆 New personal best!
          </p>
        ) : (
          <p className="mt-3 text-xs font-semibold text-[#8a8aa0]">
            Personal best: {personalBest}
          </p>
        )}

        <dl className="mt-5 grid grid-cols-2 gap-2 text-left">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[#f6f7fb] p-3">
              <dt className="text-[0.6rem] font-black tracking-[0.15em] text-[#8a8aa0] uppercase">
                {label}
              </dt>
              <dd className="text-xl font-black text-[#141420] tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 flex items-center justify-center gap-2 text-xl font-black text-[#b8860b]">
          <CoinIcon className="h-6 w-6" />+{coinsEarned} coins
        </p>
        {reducedReward ? (
          <p className="mt-1 text-xs font-semibold text-[#8a8aa0]">
            You&apos;ve played a lot today — keep practising, later rounds earn
            fewer coins.
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
          onClick={onChangeDifficulty}
          className="mt-2 w-full rounded-2xl border-4 border-[#c9cde0] bg-white px-6 py-3 text-base font-black text-[#4a4a60]"
        >
          CHANGE DIFFICULTY
        </button>
        <button
          type="button"
          onClick={onBackToBasketball}
          className="mt-2 w-full rounded-xl px-4 py-2 text-sm font-black text-[#4a4a60] hover:text-[#141420]"
        >
          Back to Basketball
        </button>
        <button
          type="button"
          onClick={onExit}
          className="mt-1 w-full rounded-xl px-4 py-2 text-sm font-bold text-[#8a8aa0] hover:text-[#141420]"
        >
          Back to TalkWise Play
        </button>
      </div>
    </div>
  );
}
