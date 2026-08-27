"use client";

/**
 * Speech Power-Ups — the temporary reward layer.
 *
 * ## What this is, and what it deliberately is not
 *
 * §8 asks for an original TalkWise engagement reward in the space a
 * competitor fills with face filters, and is explicit that we are not
 * copying the face-filter implementation. So: no camera, no face tracking,
 * no filters. A power-up here is a **temporary in-round transformation of
 * the child's character** — rocket shoes, a cape, a crown, a star trail —
 * earned by a run of successes and lasting seconds.
 *
 * Equally explicit in §8: these are temporary game rewards, and permanent
 * cosmetics remain a store decision. So nothing here writes to an inventory,
 * nothing here is purchasable, and nothing here can appear in the GAME-001
 * or GAME-002 shops. A power-up exists only for the seconds it is lit and is
 * gone when the round ends. That is also why it needs no save key at all.
 *
 * ## How one is earned
 *
 * A combo of `POWER_UP_COMBO` correct actions in a row lights one — the "5
 * Bubble Blast correct hits → TJ gets rocket shoes for 10 seconds" example
 * from §8, at the number §8 gives. Which power-up is drawn rotates so the
 * same one does not appear every time, and a power-up already lit is
 * *extended* rather than replaced, so a child on a hot streak keeps the
 * thing they earned instead of watching it flicker between costumes.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { miniAudio } from "./audio";
import { emitMiniGameEvent } from "./analytics";

/** Permanent power-up ids. Not saved anywhere — see the note above — but
 * stable so analytics can count them. */
export type PowerUpId =
  | "rocket-shoes"
  | "hero-cape"
  | "crown"
  | "star-trail"
  | "glow-aura"
  | "animal-ears"
  | "silly-glasses"
  | "tiny-dragon";

export interface PowerUpDefinition {
  id: PowerUpId;
  /** Kid-facing name, shown big when it lights. */
  label: string;
  glyph: string;
  /** One short line of celebration. */
  shout: string;
  /** Tailwind gradient for the badge. */
  gradient: string;
}

export const POWER_UPS: PowerUpDefinition[] = [
  {
    id: "rocket-shoes",
    label: "Rocket Shoes",
    glyph: "🚀",
    shout: "Zoom zoom!",
    gradient: "from-[#ff8a3d] to-[#e0442c]",
  },
  {
    id: "hero-cape",
    label: "Hero Cape",
    glyph: "🦸",
    shout: "Super talking!",
    gradient: "from-[#4ac1ff] to-[#2f6fd4]",
  },
  {
    id: "crown",
    label: "Golden Crown",
    glyph: "👑",
    shout: "You rule!",
    gradient: "from-[#ffd76e] to-[#e0a020]",
  },
  {
    id: "star-trail",
    label: "Star Trail",
    glyph: "✨",
    shout: "Sparkle time!",
    gradient: "from-[#ffe066] to-[#f0973d]",
  },
  {
    id: "glow-aura",
    label: "Glow Aura",
    glyph: "🌟",
    shout: "You are glowing!",
    gradient: "from-[#8fe3c4] to-[#2f9e8c]",
  },
  {
    id: "animal-ears",
    label: "Animal Ears",
    glyph: "🐰",
    shout: "Hop hop!",
    gradient: "from-[#ff9ecd] to-[#c76bb0]",
  },
  {
    id: "silly-glasses",
    label: "Silly Glasses",
    glyph: "🕶️",
    shout: "Looking cool!",
    gradient: "from-[#a273e8] to-[#6d3fd4]",
  },
  {
    id: "tiny-dragon",
    label: "Tiny Dragon",
    glyph: "🐉",
    shout: "Roar!",
    gradient: "from-[#7ed957] to-[#2f9e52]",
  },
];

/** Correct answers in a row that light a power-up. */
export const POWER_UP_COMBO = 5;

/** How long one stays lit. */
export const POWER_UP_DURATION_MS = 10000;

export interface ActivePowerUp {
  definition: PowerUpDefinition;
  /** Wall-clock time it switches off. */
  until: number;
}

export interface PowerUpApi {
  active: ActivePowerUp | null;
  /**
   * Offers a combo to the power-up layer. Lights one when the combo is a
   * multiple of `POWER_UP_COMBO`, extends the current one if there is one.
   * Safe to call on every correct action.
   */
  offerCombo: (combo: number) => void;
  /** Clears any active power-up. Called when a round ends. */
  clear: () => void;
  /** How many were lit this session, for the results screen. */
  earnedCount: number;
}

/**
 * Runs the power-up layer for one mini-game.
 *
 * `enabled` comes from the mini-game's registry entry, so a game where a
 * costume would distract from the task — Guess the Sound, which is about
 * listening — simply passes `false` and gets an inert API rather than
 * special-casing.
 */
export function usePowerUps(options: {
  enabled: boolean;
  gameId: string;
  muted?: boolean;
}): PowerUpApi {
  const { enabled, gameId, muted = false } = options;
  const [active, setActive] = useState<ActivePowerUp | null>(null);
  const [earnedCount, setEarnedCount] = useState(0);
  const timerRef = useRef<number | null>(null);
  const nextIndexRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    clearTimer();
    setActive(null);
  }, [clearTimer]);

  const offerCombo = useCallback(
    (combo: number) => {
      if (!enabled) return;
      if (combo === 0 || combo % POWER_UP_COMBO !== 0) return;

      const until = Date.now() + POWER_UP_DURATION_MS;

      setActive((current) => {
        // Already lit: extend the same costume rather than swapping it. A
        // child on a streak should keep what they earned.
        if (current) return { ...current, until };
        const definition = POWER_UPS[nextIndexRef.current % POWER_UPS.length];
        nextIndexRef.current += 1;
        if (!muted) miniAudio.powerUp();
        emitMiniGameEvent({
          name: "power_up_activated",
          gameId,
          detail: definition.id,
        });
        return { definition, until };
      });
      setEarnedCount((count) => count + 1);

      clearTimer();
      timerRef.current = window.setTimeout(() => {
        setActive(null);
        timerRef.current = null;
      }, POWER_UP_DURATION_MS);
    },
    [enabled, muted, gameId, clearTimer],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return { active, offerCombo, clear, earnedCount };
}
