/**
 * The Mini Game registry.
 *
 * `platform/games/registry.ts` knows *that* Bubble Blast exists — its id,
 * its route, its library card. This file knows what it *needs*: which
 * learning levels it can run, which content packs it can use, how long a
 * session is, and which shared framework services it turns on.
 *
 * The split is the same one GAME-002 draws between the platform registry and
 * its own `modes/registry.ts`, and for the same reason: the platform must
 * not have to know what a content pack is, and a mini-game must not have to
 * restate its own route in two places.
 *
 * Adding GAME-009 later means: a component, an entry in the platform
 * registry, an entry here, and a save key. Nothing in an existing mini-game
 * gets edited.
 */

import type { ContentPackId, MiniLearningLevel } from "@/content/minigames/types";
import { listContentPacks } from "@/content/minigames";
import type { ContentCapability } from "@/content/minigames/types";
import {
  GAME_ACTION_DASH,
  GAME_BUBBLE_BLAST,
  GAME_COLOR_SHAPE_HUNT,
  GAME_GUESS_THE_SOUND,
  GAME_SOUND_MATCH,
  GAME_STORY_BUILDER,
  type MiniGameId,
} from "@/platform/games/registry";

/**
 * How a mini-game uses the child's voice.
 *
 * §17 and §5 both push against forcing an identical speech structure onto
 * six different games. So each declares its own cadence:
 *
 * - `gate-once` — one speech target before the round starts, then play.
 *   Bubble Blast and Action Dash. Keeps a thirty-second arcade round
 *   arcade-paced.
 * - `per-round` — a speech moment on each round of the game. Sound Match
 *   and Story Builder, where the rounds are already slow enough to carry it.
 * - `optional` — the game runs on touch and offers the speech moment as a
 *   celebration rather than a gate. Colour & Shape Hunt and Guess the Sound,
 *   where §5 explicitly warns that requiring the microphone on every tap
 *   would slow the game down more than it would help.
 */
export type SpeechCadence = "gate-once" | "per-round" | "optional";

export interface MiniGameDefinition {
  id: MiniGameId;
  /** Two-digit card number, matching the launch order. */
  number: string;
  /** Learning levels this mini-game can genuinely run. */
  levels: MiniLearningLevel[];
  /** Properties an item must carry for this game to use it. */
  requires: ContentCapability[];
  /**
   * Packs this game can run. `"all"` means every registered pack — the
   * capability filter above is what actually keeps unusable content out, so
   * most games can honestly say "all" and gain a pack for free when one is
   * added.
   */
  packs: ContentPackId[] | "all";
  /** Default pack when a child has no saved preference. */
  defaultPack: ContentPackId;
  speech: SpeechCadence;
  /** Roughly how long one session runs, for the setup screen. */
  sessionLabel: string;
  /**
   * How many points one correct action is worth. Kept here rather than in
   * each game so the six scoring scales stay comparable — which is what
   * makes one shared coin formula fair across all of them.
   */
  pointsPerCorrect: number;
  /**
   * Score-to-coin divisor for this game. Tuned so a strong session of any
   * mini-game earns a similar number of coins: a 30-second Bubble Blast
   * round produces far more raw points than an 8-round Sound Match, and
   * paying per point without this would make one game the only rational
   * choice. See `rewards.ts` for the whole formula.
   */
  pointsPerCoin: number;
  /** Whether streak power-ups can trigger in this game (§8). */
  powerUps: boolean;
}

const MINI_GAMES: MiniGameDefinition[] = [
  {
    id: GAME_BUBBLE_BLAST,
    number: "03",
    levels: ["beginner", "intermediate", "expert"],
    requires: [],
    packs: "all",
    defaultPack: "animal-world",
    speech: "gate-once",
    sessionLabel: "30 seconds",
    pointsPerCorrect: 100,
    pointsPerCoin: 220,
    powerUps: true,
  },
  {
    id: GAME_SOUND_MATCH,
    number: "04",
    levels: ["beginner", "intermediate", "expert"],
    requires: [],
    packs: "all",
    defaultPack: "animal-world",
    speech: "per-round",
    sessionLabel: "8 rounds",
    pointsPerCorrect: 100,
    pointsPerCoin: 90,
    powerUps: true,
  },
  {
    id: GAME_COLOR_SHAPE_HUNT,
    number: "05",
    levels: ["beginner", "intermediate", "expert"],
    requires: ["color", "shape"],
    packs: ["colors-and-shapes"],
    defaultPack: "colors-and-shapes",
    speech: "optional",
    sessionLabel: "8 finds",
    pointsPerCorrect: 100,
    pointsPerCoin: 90,
    powerUps: true,
  },
  {
    id: GAME_GUESS_THE_SOUND,
    number: "06",
    levels: ["beginner", "intermediate", "expert"],
    requires: ["listen"],
    packs: ["animal-world", "things-that-go", "around-the-house", "outside-adventures"],
    defaultPack: "animal-world",
    speech: "optional",
    sessionLabel: "8 sounds",
    pointsPerCorrect: 100,
    pointsPerCoin: 90,
    powerUps: false,
  },
  {
    id: GAME_ACTION_DASH,
    number: "07",
    levels: ["beginner", "intermediate", "expert"],
    requires: ["action"],
    packs: ["action-time"],
    defaultPack: "action-time",
    speech: "gate-once",
    sessionLabel: "8 actions",
    pointsPerCorrect: 100,
    pointsPerCoin: 90,
    powerUps: true,
  },
  {
    id: GAME_STORY_BUILDER,
    number: "08",
    levels: ["beginner", "intermediate", "expert"],
    requires: ["sentence"],
    packs: ["animal-world", "food-fun", "things-that-go", "outside-adventures", "action-time"],
    defaultPack: "animal-world",
    speech: "per-round",
    sessionLabel: "4 scenes",
    pointsPerCorrect: 100,
    pointsPerCoin: 60,
    powerUps: false,
  },
];

export function listMiniGames(): MiniGameDefinition[] {
  return MINI_GAMES;
}

export function getMiniGame(id: MiniGameId): MiniGameDefinition {
  const game = MINI_GAMES.find((entry) => entry.id === id);
  if (!game) throw new Error(`Unknown TalkWise mini-game: ${id}`);
  return game;
}

/** The packs one mini-game can actually offer, resolved against the library. */
export function packsFor(definition: MiniGameDefinition): ContentPackId[] {
  if (definition.packs === "all") {
    return listContentPacks().map((pack) => pack.id);
  }
  return definition.packs;
}

/** Coerces a saved or URL-supplied pack id to one this game can run. */
export function coercePack(
  definition: MiniGameDefinition,
  value: unknown,
): ContentPackId {
  const allowed = packsFor(definition);
  return typeof value === "string" && (allowed as string[]).includes(value)
    ? (value as ContentPackId)
    : definition.defaultPack;
}

/** Coerces a saved or URL-supplied level to one this game can run. */
export function coerceLevel(
  definition: MiniGameDefinition,
  value: unknown,
): MiniLearningLevel {
  return typeof value === "string" &&
    (definition.levels as string[]).includes(value)
    ? (value as MiniLearningLevel)
    : definition.levels[0];
}
