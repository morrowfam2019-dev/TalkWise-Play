"use client";

/**
 * The 3 · 2 · 1 · GO! that opens a timed round.
 *
 * Short on purpose — three beats at 600 ms is 1.8 seconds, which is long
 * enough to get a thumb ready and short enough that it does not eat a
 * meaningful fraction of a thirty-second game. It also does the one job a
 * countdown quietly has to do on mobile: it gives the AudioContext a moment
 * to actually be running before the first game sound needs to play.
 */

import { useEffect, useState } from "react";
import { miniAudio } from "../audio";

const BEAT_MS = 600;

export function CountdownOverlay({ onDone }: { onDone: () => void }) {
  const [beat, setBeat] = useState(3);

  useEffect(() => {
    if (beat < 0) return;
    if (beat > 0) miniAudio.countdownTick();
    else miniAudio.countdownGo();

    const timer = window.setTimeout(() => {
      if (beat === 0) onDone();
      else setBeat((current) => current - 1);
    }, BEAT_MS);
    return () => window.clearTimeout(timer);
  }, [beat, onDone]);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-[#141420]/45 backdrop-blur-[2px]">
      <p
        key={beat}
        className="tw-pop text-8xl font-black text-white drop-shadow-2xl sm:text-9xl"
      >
        {beat === 0 ? "GO!" : beat}
      </p>
    </div>
  );
}
