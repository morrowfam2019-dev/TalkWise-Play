/**
 * Speech Basketball's mode registry.
 *
 * GAME-002 is one game with several ways to play it. This file is the single
 * place that knows which modes exist — the home screen, the routes and every
 * saved record read from here rather than from a conditional scattered
 * through the engine.
 *
 * The same discipline the platform applies to games, Basketball applies to
 * its own modes: `id` is permanent and written into saved data, `title` is
 * kid-facing and safe to rebrand.
 *
 * Adding a fourth mode later should mean: add its component, add an entry
 * here, add its record shape in `player/games/basketball.ts`. Nothing in an
 * existing mode should need editing.
 */

import type { SpeechDifficulty } from "@/content/speech/engine";

/** Permanent mode id. Written into saved records — never change these. */
export type BasketballModeId = "shootout" | "timeAttack" | "clutch";

export type BasketballModeStatus = "live" | "coming-soon";

export interface BasketballModeDefinition {
  id: BasketballModeId;
  /** Two-digit card number shown on the mode-select screen. */
  number: string;
  /** Kid-facing name. Safe to rebrand. */
  title: string;
  /** Short kicker under the title, e.g. "Quick Play". */
  kicker: string;
  /** One line describing the mode on its card. */
  blurb: string;
  glyph: string;
  /** Tailwind gradient classes for the card banner. */
  cardGradient: string;
  status: BasketballModeStatus;
  /** URL segment under `/games/basketball/`. */
  slug: string;
  /**
   * Speech difficulties this mode can actually run. Every live mode supports
   * all three today; the field exists so a future mode can opt out of one
   * without the picker having to special-case it.
   */
  difficulties: SpeechDifficulty[];
}

const MODES: BasketballModeDefinition[] = [
  {
    id: "shootout",
    number: "01",
    title: "Speech Shootout",
    kicker: "Quick Play",
    blurb: "Say a word, unlock a shot, time the meter. Ten shots.",
    glyph: "🏀",
    cardGradient: "from-[#ff9f4a] to-[#e0662c]",
    status: "live",
    slug: "shootout",
    difficulties: ["easy", "intermediate", "hard"],
  },
  {
    id: "timeAttack",
    number: "02",
    title: "Time Attack",
    kicker: "Arcade Challenge",
    blurb: "Say it once, then flick as many baskets as you can in 30 seconds.",
    glyph: "⏱️",
    cardGradient: "from-[#4ac1ff] to-[#2f6fd4]",
    status: "live",
    slug: "time-attack",
    difficulties: ["easy", "intermediate", "hard"],
  },
  {
    id: "clutch",
    number: "03",
    title: "1-on-1 Clutch",
    kicker: "Coming Soon",
    blurb: "Beat the defender to the shot. In training — back soon.",
    glyph: "🛡️",
    cardGradient: "from-[#a97bff] to-[#6d3fd4]",
    status: "coming-soon",
    slug: "clutch",
    difficulties: ["easy", "intermediate", "hard"],
  },
];

export function listBasketballModes(): BasketballModeDefinition[] {
  return MODES;
}

export function getBasketballMode(
  id: BasketballModeId,
): BasketballModeDefinition {
  const mode = MODES.find((entry) => entry.id === id);
  if (!mode) throw new Error(`Unknown Speech Basketball mode: ${id}`);
  return mode;
}

export function getBasketballModeBySlug(
  slug: string,
): BasketballModeDefinition | undefined {
  return MODES.find((entry) => entry.slug === slug);
}
