"use client";

import { useEffect, useState } from "react";
import type { WorldAction } from "../world/types";

interface HudProps {
  completedCount: number;
  totalCheckpoints: number;
  coins: number;
  nearWord: string | null;
  /** The level's one verb, so the hint names the button a child actually has. */
  action: WorldAction;
  finishUnlocked: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
}

/**
 * Gameplay HUD. Two numbers, one hint line, and nothing else — anything more
 * competes with the world for a child's attention.
 */
export function Hud({
  completedCount,
  totalCheckpoints,
  coins,
  nearWord,
  action,
  finishUnlocked,
  muted,
  onToggleMute,
  onExit,
}: HudProps) {
  const [showControlsHint, setShowControlsHint] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowControlsHint(false), 9000);
    return () => window.clearTimeout(timer);
  }, []);

  const progress = totalCheckpoints > 0 ? completedCount / totalCheckpoints : 0;

  return (
    <>
      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
        <div className="flex flex-col gap-2">
          <div className="pointer-events-auto rounded-2xl border-4 border-white/70 bg-[#141420]/85 px-3 py-2 shadow-lg backdrop-blur-sm sm:px-4">
            <div className="flex items-center gap-2 text-base font-extrabold text-white sm:text-lg">
              <span aria-hidden>⭐</span>
              <span className="tabular-nums" data-testid="hud-checkpoints">
                {completedCount} / {totalCheckpoints}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-24 overflow-hidden rounded-full bg-white/20 sm:w-32">
              <div
                className="h-full rounded-full bg-[#f5c33b] transition-[width] duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="pointer-events-auto rounded-2xl border-4 border-white/70 bg-[#141420]/85 px-3 py-2 text-base font-extrabold text-[#f5c33b] shadow-lg backdrop-blur-sm sm:px-4 sm:text-lg">
            <span aria-hidden>🪙</span>{" "}
            <span className="tabular-nums text-white" data-testid="hud-coins">
              {coins}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? "Turn sound on" : "Turn sound off"}
              className="pointer-events-auto grid h-11 w-11 place-items-center rounded-2xl border-4 border-white/70 bg-[#141420]/85 text-lg shadow-lg backdrop-blur-sm active:scale-95"
            >
              <span aria-hidden>{muted ? "🔇" : "🔊"}</span>
            </button>
            <button
              type="button"
              onClick={onExit}
              aria-label="Back to TalkWise Play"
              className="pointer-events-auto grid h-11 w-11 place-items-center rounded-2xl border-4 border-white/70 bg-[#141420]/85 text-lg shadow-lg backdrop-blur-sm active:scale-95"
            >
              <span aria-hidden>🏠</span>
            </button>
          </div>
        </div>
      </div>

      {/* Objective / proximity hint */}
      <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center px-4 sm:top-28">
        {nearWord ? (
          <div className="animate-pulse rounded-full border-4 border-[#f5c33b] bg-white px-5 py-2 text-center text-base font-extrabold text-[#141420] shadow-xl sm:text-lg">
            Speech challenge ahead: {nearWord}
          </div>
        ) : finishUnlocked ? (
          <div className="rounded-full border-4 border-[#2ecc71] bg-white px-5 py-2 text-center text-base font-extrabold text-[#141420] shadow-xl sm:text-lg">
            🎉 All done! Climb to the portal at the top!
          </div>
        ) : null}
      </div>

      {/* Controls hint */}
      {showControlsHint ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-48 flex justify-center px-4 sm:bottom-6">
          <p className="rounded-full bg-[#141420]/75 px-4 py-2 text-center text-xs font-bold text-white/90 backdrop-blur-sm sm:text-sm">
            <span className="hidden sm:inline">
              WASD or arrows to move · drag to look · space to{" "}
              {action === "jump" ? "jump" : "slide"}
            </span>
            <span className="sm:hidden">Left stick to move · drag to look</span>
          </p>
        </div>
      ) : null}
    </>
  );
}
