"use client";

interface ResultsScreenProps {
  levelTitle: string;
  completedCount: number;
  totalCheckpoints: number;
  coins: number;
  isNewBest: boolean;
  onReplay: () => void;
  onExit: () => void;
}

/** End-of-run celebration. */
export function ResultsScreen({
  levelTitle,
  completedCount,
  totalCheckpoints,
  coins,
  isNewBest,
  onReplay,
  onExit,
}: ResultsScreenProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${levelTitle} complete`}
      className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-[#141420]/80 p-4 backdrop-blur-sm"
    >
      <div className="tw-pop w-full max-w-md rounded-[2rem] border-8 border-[#f5c33b] bg-white p-6 text-center shadow-2xl sm:p-8">
        <div className="flex justify-center gap-2 text-4xl" aria-hidden>
          <span className="tw-star" style={{ animationDelay: "0ms" }}>
            🎉
          </span>
          <span className="tw-star" style={{ animationDelay: "150ms" }}>
            🏆
          </span>
          <span className="tw-star" style={{ animationDelay: "300ms" }}>
            🎉
          </span>
        </div>

        <h2 className="mt-4 text-3xl font-black tracking-tight text-[#141420] sm:text-4xl">
          {levelTitle.toUpperCase()} COMPLETE!
        </h2>

        {isNewBest ? (
          <p className="mt-2 inline-block rounded-full bg-[#fff4d6] px-4 py-1 text-sm font-black tracking-wide text-[#b8860b] uppercase">
            New best!
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#f3f4f8] p-4">
            <p className="text-3xl font-black text-[#141420]">
              {completedCount} / {totalCheckpoints}
            </p>
            <p className="mt-1 text-xs font-bold tracking-wide text-[#6b6b80] uppercase">
              Speech challenges
            </p>
          </div>
          <div className="rounded-2xl bg-[#fff8e6] p-4">
            <p className="text-3xl font-black text-[#b8860b]">{coins}</p>
            <p className="mt-1 text-xs font-bold tracking-wide text-[#6b6b80] uppercase">
              Coins earned
            </p>
          </div>
        </div>

        <p className="mt-5 text-lg font-extrabold text-[#2f7fd4]">
          Amazing speaking! Your /m/ sound is getting stronger.
        </p>

        <button
          type="button"
          onClick={onReplay}
          className="mt-6 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-4 text-xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
        >
          PLAY AGAIN
        </button>

        <button
          type="button"
          onClick={onExit}
          className="mt-3 w-full rounded-2xl border-b-8 border-[#000] bg-[#141420] px-6 py-4 text-lg font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
        >
          BACK TO TALKWISE PLAY
        </button>
      </div>
    </div>
  );
}
