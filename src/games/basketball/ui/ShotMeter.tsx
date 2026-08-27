"use client";

import { useEffect, useRef, useState } from "react";
import type { DifficultyConfig } from "@/content/basketball/types";
import type { TimingTier } from "../core/round";

/**
 * The skill layer: a marker sweeps back and forth across a bar. Tap/click/
 * space locks it — green zone (best chance), yellow (harder), outside
 * (likely miss but never impossible). Speech unlocked the shot; this alone
 * decides how good a look at the basket it is.
 */
export function ShotMeter({
  difficulty,
  onLock,
}: {
  difficulty: DifficultyConfig;
  onLock: (timing: TimingTier) => void;
}) {
  const [position, setPosition] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lockedRef = useRef(false);
  const startRef = useRef(0);

  useEffect(() => {
    lockedRef.current = false;
    startRef.current = performance.now();

    const tick = () => {
      if (lockedRef.current) return;
      const elapsed = (performance.now() - startRef.current) / 1000;
      const cycle =
        (elapsed % difficulty.sweepSeconds) / difficulty.sweepSeconds;
      // Triangle wave 0 -> 1 -> 0, so the marker sweeps and returns.
      const value = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
      setPosition(value);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [difficulty]);

  const lock = () => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const distanceFromCenter = Math.abs(position - 0.5);
    const timing: TimingTier =
      distanceFromCenter <= difficulty.greenZone
        ? "perfect"
        : distanceFromCenter <= difficulty.yellowZone
          ? "good"
          : "miss";
    onLock(timing);
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        lock();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, difficulty]);

  const greenStart = (0.5 - difficulty.greenZone) * 100;
  const greenWidth = difficulty.greenZone * 2 * 100;
  const yellowStart = (0.5 - difficulty.yellowZone) * 100;
  const yellowWidth = difficulty.yellowZone * 2 * 100;

  return (
    <div className="pointer-events-auto flex w-full max-w-sm flex-col items-center gap-3">
      <div className="relative h-8 w-full overflow-hidden rounded-full border-4 border-white bg-[#8a5a2b] shadow-lg">
        <div
          className="absolute inset-y-0 rounded-full bg-[#f5c33b]/50"
          style={{ left: `${yellowStart}%`, width: `${yellowWidth}%` }}
        />
        <div
          className="absolute inset-y-0 rounded-full bg-[#2ecc71]"
          style={{ left: `${greenStart}%`, width: `${greenWidth}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-1.5 -translate-x-1/2 rounded-full bg-white shadow"
          style={{ left: `${position * 100}%` }}
        />
      </div>
      <button
        type="button"
        onClick={lock}
        onTouchStart={(event) => {
          event.preventDefault();
          lock();
        }}
        className="w-full rounded-2xl border-b-8 border-[#b8860b] bg-[#f5c33b] px-6 py-4 text-xl font-black text-[#141420] shadow-lg transition-transform active:translate-y-1 active:border-b-4"
      >
        🏀 SHOOT
      </button>
    </div>
  );
}
