"use client";

/**
 * The results screen every mini-game shares.
 *
 * ## What it leads with, and why
 *
 * The child's score, then their coins, then a personal-best ribbon if they
 * earned one. Accuracy is present but small and last: §17 rules out failure
 * framing, and a four-year-old greeted by "62%" has been graded, not
 * celebrated. Parents can read the number; it should not be the headline.
 *
 * The coin breakdown is shown the way GAME-002's results card shows it —
 * a child who earned fewer coins because it is their ninth round today
 * should be able to see *why* rather than conclude the game is broken.
 * §19 asks for the formula to be documented; showing it is the same promise
 * kept where it actually matters.
 *
 * PLAY AGAIN is the primary action, because §2's whole thesis is that these
 * games are replayable and a results screen that makes leaving easier than
 * replaying is fighting its own product.
 */

import Link from "next/link";
import { CoinIcon } from "@/ui/CoinIcon";
import type { MiniGameReward } from "../rewards";
import type { MiniSessionSummary } from "../session";

export function MiniGameResults({
  title,
  summary,
  reward,
  wasPersonalBest,
  bestScore,
  powerUpsEarned,
  onReplay,
  setupHref,
  /** A game-specific line, e.g. "You built 4 stories!". */
  highlight,
}: {
  title: string;
  summary: MiniSessionSummary;
  reward: MiniGameReward;
  wasPersonalBest: boolean;
  bestScore: number;
  powerUpsEarned: number;
  onReplay: () => void;
  setupHref: string;
  highlight?: string;
}) {
  const { breakdown } = reward;
  const reduced = breakdown.multiplier < 1;

  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[#141420]/75 p-4 backdrop-blur-sm">
      <div className="tw-pop my-auto w-full max-w-sm rounded-[2rem] border-8 border-[#f5c33b] bg-white p-5 text-center shadow-2xl">
        <p className="text-xs font-black tracking-[0.22em] text-[#8a8aa0] uppercase">
          {title}
        </p>

        {wasPersonalBest ? (
          <p className="tw-star mt-2 inline-block rounded-full bg-[#f5c33b] px-4 py-1.5 text-sm font-black tracking-wide text-[#141420] uppercase">
            ⭐ New personal best!
          </p>
        ) : null}

        <p className="mt-2 text-6xl font-black text-[#141420] tabular-nums">
          {summary.score}
        </p>
        <p className="text-xs font-black tracking-widest text-[#8a8aa0] uppercase">
          Points
        </p>

        {highlight ? (
          <p className="mt-2 text-lg font-black text-[#2ecc71]">{highlight}</p>
        ) : null}

        <div className="mt-4 rounded-2xl border-4 border-[#f5c33b] bg-[#fffaef] p-3">
          <p className="flex items-center justify-center gap-2 text-4xl font-black text-[#141420] tabular-nums">
            <CoinIcon className="h-8 w-8" />+{reward.coins}
          </p>
          <p className="text-xs font-black tracking-widest text-[#8a8aa0] uppercase">
            Coins earned
          </p>

          <dl className="mt-2 space-y-0.5 text-left text-xs font-bold text-[#6b6b80]">
            {breakdown.speechParticipation > 0 ? (
              <div className="flex justify-between">
                <dt>🗣️ You used your voice</dt>
                <dd className="tabular-nums">+{breakdown.speechParticipation}</dd>
              </div>
            ) : null}
            {breakdown.performance > 0 ? (
              <div className="flex justify-between">
                <dt>🎯 How you played</dt>
                <dd className="tabular-nums">+{breakdown.performance}</dd>
              </div>
            ) : null}
            {breakdown.personalBest > 0 ? (
              <div className="flex justify-between">
                <dt>⭐ Personal best</dt>
                <dd className="tabular-nums">+{breakdown.personalBest}</dd>
              </div>
            ) : null}
            {breakdown.levelBonus > 0 ? (
              <div className="flex justify-between">
                <dt>🧠 Harder level</dt>
                <dd className="tabular-nums">+{breakdown.levelBonus}</dd>
              </div>
            ) : null}
          </dl>

          {breakdown.reducedForShortSession ? (
            <p className="mt-2 rounded-xl bg-[#eaf4ff] px-2 py-1.5 text-[0.7rem] font-bold text-[#2f7fd4]">
              That was a very short go — play a full round for more coins!
            </p>
          ) : reduced ? (
            <p className="mt-2 rounded-xl bg-[#eaf4ff] px-2 py-1.5 text-[0.7rem] font-bold text-[#2f7fd4]">
              You have played lots today — keep going for fun, coins are
              smaller now.
            </p>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[#f4f6fa] py-2">
            <p className="text-xl font-black text-[#141420] tabular-nums">
              {summary.correct}
            </p>
            <p className="text-[0.55rem] font-black tracking-widest text-[#8a8aa0] uppercase">
              Got it
            </p>
          </div>
          <div className="rounded-xl bg-[#f4f6fa] py-2">
            <p className="text-xl font-black text-[#141420] tabular-nums">
              {summary.bestCombo}
            </p>
            <p className="text-[0.55rem] font-black tracking-widest text-[#8a8aa0] uppercase">
              Best streak
            </p>
          </div>
          <div className="rounded-xl bg-[#f4f6fa] py-2">
            <p className="text-xl font-black text-[#141420] tabular-nums">
              {bestScore}
            </p>
            <p className="text-[0.55rem] font-black tracking-widest text-[#8a8aa0] uppercase">
              Your best
            </p>
          </div>
        </div>

        {powerUpsEarned > 0 ? (
          <p className="mt-2 text-sm font-black text-[#a273e8]">
            ⚡ {powerUpsEarned} power-up{powerUpsEarned === 1 ? "" : "s"} this
            round!
          </p>
        ) : null}

        <p className="mt-2 text-[0.7rem] font-semibold text-[#8a8aa0]">
          {summary.accuracy}% on target
        </p>

        <button
          type="button"
          onClick={onReplay}
          className="mt-4 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-2xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
        >
          PLAY AGAIN
        </button>
        <Link
          href={setupHref}
          className="mt-2 block w-full rounded-xl border-2 border-[#e2e4ee] px-4 py-3 text-sm font-black text-[#4a4a60]"
        >
          Change pack or level
        </Link>
        <Link
          href="/"
          className="mt-2 block w-full rounded-xl px-4 py-2 text-xs font-bold text-[#4a6b78] underline"
        >
          Back to TalkWise Play
        </Link>
      </div>
    </div>
  );
}
