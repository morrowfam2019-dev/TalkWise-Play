"use client";

/**
 * The badge that announces a Speech Power-Up and stays on screen while it
 * lasts.
 *
 * Deliberately non-blocking: it floats in a corner rather than interrupting
 * play with a modal. A power-up is a celebration of a streak, and stopping
 * the round to tell a child they are doing well would break the streak that
 * earned it.
 */

import type { ActivePowerUp } from "../powerups";

export function PowerUpBadge({ active }: { active: ActivePowerUp | null }) {
  if (!active) return null;
  const { definition } = active;

  return (
    <div
      className={`tw-pop pointer-events-none absolute top-3 left-1/2 z-30 -translate-x-1/2 rounded-full border-4 border-white bg-gradient-to-r ${definition.gradient} px-4 py-2 shadow-xl`}
    >
      <p className="flex items-center gap-2 text-sm font-black tracking-wide text-white uppercase drop-shadow">
        <span className="text-xl" aria-hidden>
          {definition.glyph}
        </span>
        {definition.label}
      </p>
    </div>
  );
}
