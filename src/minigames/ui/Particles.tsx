"use client";

/**
 * Feedback particles — the burst a correct action leaves behind.
 *
 * ## Why this is one shared, pooled component
 *
 * §31 asks for object pooling and bounded animations, and §4 asks for one
 * particle system rather than six. Both are honoured by the same design:
 * a fixed-size ring buffer of bursts (`MAX_BURSTS`) that overwrites its
 * oldest entry rather than growing, and pure CSS keyframes on transform and
 * opacity so the compositor does the work rather than React.
 *
 * The cap is the important part. A child who pops thirty bubbles in thirty
 * seconds would otherwise mount hundreds of nodes; with the ring buffer the
 * DOM never holds more than `MAX_BURSTS × PARTICLES_PER_BURST` particles no
 * matter how fast they play, so the last ten seconds of a round run exactly
 * as smoothly as the first.
 */

import { useCallback, useRef, useState } from "react";

export const MAX_BURSTS = 8;
export const PARTICLES_PER_BURST = 7;
export const BURST_DURATION_MS = 700;

export interface Burst {
  key: number;
  /** Position as a percentage of the stage, so bursts survive a resize. */
  xPercent: number;
  yPercent: number;
  glyph: string;
  tint: string;
}

export interface ParticleApi {
  bursts: Burst[];
  /** Fires a burst at a point given as stage percentages. */
  burst: (xPercent: number, yPercent: number, glyph?: string, tint?: string) => void;
  clear: () => void;
}

export function useParticles(): ParticleApi {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const keyRef = useRef(0);

  const burst = useCallback(
    (xPercent: number, yPercent: number, glyph = "✨", tint = "#f5c33b") => {
      keyRef.current += 1;
      const entry: Burst = { key: keyRef.current, xPercent, yPercent, glyph, tint };
      setBursts((current) => {
        const next = [...current, entry];
        // Ring buffer: drop the oldest rather than letting the list grow.
        return next.length > MAX_BURSTS ? next.slice(next.length - MAX_BURSTS) : next;
      });
    },
    [],
  );

  const clear = useCallback(() => setBursts([]), []);

  return { bursts, burst, clear };
}

/**
 * Renders the bursts. Absolutely positioned and pointer-transparent, so it
 * can be laid over any stage without ever intercepting a tap — which would
 * be a particularly cruel way to break §16's touch rules.
 */
export function ParticleLayer({ bursts }: { bursts: Burst[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bursts.map((entry) => (
        <div
          key={entry.key}
          className="absolute"
          style={{ left: `${entry.xPercent}%`, top: `${entry.yPercent}%` }}
        >
          {Array.from({ length: PARTICLES_PER_BURST }).map((_, index) => {
            const angle = (index / PARTICLES_PER_BURST) * Math.PI * 2;
            return (
              <span
                key={index}
                className="tw-particle absolute text-lg"
                style={
                  {
                    color: entry.tint,
                    "--tw-particle-x": `${Math.cos(angle) * 46}px`,
                    "--tw-particle-y": `${Math.sin(angle) * 46}px`,
                  } as React.CSSProperties
                }
              >
                {entry.glyph}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
