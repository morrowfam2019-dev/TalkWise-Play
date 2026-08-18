/**
 * The TalkWise Play game registry.
 *
 * TalkWise Play is a *platform*, not a game. This file is the single place
 * that knows which games exist; the library homepage, routing, and every
 * namespaced data lookup read from here rather than hard-coding two games.
 *
 * Adding GAME-003 later should mean: add its module, add an entry here, done.
 * Nothing in GAME-001 or GAME-002 should need editing.
 */

/**
 * Permanent internal game id.
 *
 * These strings are written into saved progress, inventories, and high
 * scores, so they are **immutable**. The kid-facing name is `displayName`
 * and may be rebranded freely — renaming "Speech Basketball" to
 * "TalkWise Hoops" must never orphan a child's saved data.
 */
export const GAME_ADVENTURES = "GAME-001" as const;
export const GAME_BASKETBALL = "GAME-002" as const;

export type GameId = typeof GAME_ADVENTURES | typeof GAME_BASKETBALL;

/** Whether a game can be entered from the library right now. */
export type GameStatus = "live" | "coming-soon";

export interface GameDefinition {
  /** Permanent id. Never changes, never reused. */
  id: GameId;
  /** Kid-facing name. Safe to rebrand. */
  displayName: string;
  /** One line for the library card. */
  tagline: string;
  /** Emoji used as the card's artwork stand-in (keeps the library asset-free). */
  glyph: string;
  /** Tailwind gradient classes for the card banner. */
  cardGradient: string;
  status: GameStatus;
  /** Where the game's own home screen lives. */
  route: string;
  /**
   * Namespace key for this game's saved progress, inventory and shop
   * ownership. Equal to the game id — kept as its own field so the concept
   * stays explicit at every call site that reaches into player data.
   */
  namespace: GameId;
}

const GAMES: GameDefinition[] = [
  {
    id: GAME_ADVENTURES,
    displayName: "Speech Adventures",
    tagline: "Explore a world, find the checkpoints, say your sounds out loud.",
    glyph: "🗺️",
    cardGradient: "from-[#6fd36b] to-[#2fa85a]",
    status: "live",
    route: "/games/adventures",
    namespace: GAME_ADVENTURES,
  },
  {
    id: GAME_BASKETBALL,
    displayName: "Speech Basketball",
    tagline: "Say the word, unlock the shot, sink some baskets.",
    glyph: "🏀",
    cardGradient: "from-[#ff9f4a] to-[#e0662c]",
    status: "live",
    route: "/games/basketball",
    namespace: GAME_BASKETBALL,
  },
];

export function listGames(): GameDefinition[] {
  return GAMES;
}

export function getGame(id: GameId): GameDefinition {
  const game = GAMES.find((entry) => entry.id === id);
  if (!game) throw new Error(`Unknown TalkWise Play game: ${id}`);
  return game;
}

/**
 * Placeholder slots shown after the real games so the library reads as "a
 * collection that keeps growing" rather than "two games". Deliberately
 * unnamed — inventing fake future titles would be a promise, not a tease.
 */
export const FUTURE_GAME_SLOTS = 2;
