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

// Launch Collection 01 — the mini-games. Each is a fully independent
// TalkWise Play game with its own id, route, card and save namespace, not a
// mode inside a "Mini Games" wrapper: §3 of the build plan is explicit that
// they must be individually searchable and favouritable later, and that is
// only true if they are individually *registered*. What they share is the
// framework in `src/minigames`, which is infrastructure, not a game.
export const GAME_BUBBLE_BLAST = "GAME-003" as const;
export const GAME_SOUND_MATCH = "GAME-004" as const;
export const GAME_COLOR_SHAPE_HUNT = "GAME-005" as const;
export const GAME_GUESS_THE_SOUND = "GAME-006" as const;
export const GAME_STORY_BUILDER = "GAME-008" as const;

export type MiniGameId =
  | typeof GAME_BUBBLE_BLAST
  | typeof GAME_SOUND_MATCH
  | typeof GAME_COLOR_SHAPE_HUNT
  | typeof GAME_GUESS_THE_SOUND
  | typeof GAME_STORY_BUILDER;

export type GameId =
  | typeof GAME_ADVENTURES
  | typeof GAME_BASKETBALL
  | MiniGameId;

/**
 * The games that have a shop.
 *
 * Only the two large games sell anything. The mini-games are short and
 * replayable and deliberately sell nothing — §8 keeps their reward layer to
 * *temporary* in-round power-ups, and §19 keeps them on the one universal
 * wallet without adding a seventh place to spend it.
 *
 * Narrowing `purchaseItem`/`equipItem` to this type rather than `GameId`
 * means a mini-game namespace cannot be handed to a shop function at all —
 * the compiler refuses, so no mini-game can ever put an item into (or take
 * one out of) the founder-approved GAME-001 and GAME-002 inventories.
 */
export type ShopGameId = typeof GAME_ADVENTURES | typeof GAME_BASKETBALL;

/** Every mini-game id, in launch order. */
export const MINI_GAME_IDS: MiniGameId[] = [
  GAME_BUBBLE_BLAST,
  GAME_SOUND_MATCH,
  GAME_COLOR_SHAPE_HUNT,
  GAME_GUESS_THE_SOUND,
  GAME_STORY_BUILDER,
];

export function isMiniGameId(id: string): id is MiniGameId {
  return (MINI_GAME_IDS as string[]).includes(id);
}

/** Whether a game can be entered from the library right now. */
export type GameStatus = "live" | "coming-soon";

/**
 * Which library shelf a game sits on.
 *
 * "Featured" is the big, several-minute experiences; "quick-play" is the
 * mini-games. Two shelves is all §13 asks for at launch.
 */
export type GameSection = "featured" | "quick-play";

/**
 * Future-facing library tags.
 *
 * §13 says not to build search or favourites yet, but to preserve the fields
 * a search would need so that adding it later is not a data migration.
 * Nothing reads these today beyond the shelf grouping — that is the point.
 */
export type GameTag =
  | "featured"
  | "quick-play"
  | "sound-games"
  | "word-games"
  | "language-games"
  | "listening-games";

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
  /** Which library shelf this game appears on. */
  section: GameSection;
  /** Reserved for future search/favourites. See `GameTag`. */
  tags: GameTag[];
  /**
   * Key into `src/ui/gameArt` for this game's original card artwork. Games
   * without bespoke art fall back to `glyph`, which is what GAME-001 and
   * GAME-002 still do — their cards were founder-approved as they are and
   * this collection does not restyle them.
   */
  artKey?: string;
  /** Typical session length, shown on the card so a parent can pick by the
   * time they actually have. Omitted for the large games, whose length
   * varies with how long a child wants to explore. */
  sessionLength?: string;
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
    section: "featured",
    tags: ["featured", "sound-games", "word-games", "language-games"],
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
    section: "featured",
    tags: ["featured", "word-games", "language-games"],
    namespace: GAME_BASKETBALL,
  },

  // --- Launch Collection 01 — Quick Play -----------------------------------
  {
    id: GAME_BUBBLE_BLAST,
    displayName: "Bubble Blast",
    tagline: "Pop every bubble that matches your sound. Thirty seconds.",
    glyph: "\u{1FAE7}",
    cardGradient: "from-[#5cd0f5] to-[#2f7fd4]",
    status: "live",
    route: "/games/bubble-blast",
    section: "quick-play",
    tags: ["quick-play", "sound-games", "word-games"],
    artKey: "bubble-blast",
    sessionLength: "30–60 sec",
    namespace: GAME_BUBBLE_BLAST,
  },
  {
    id: GAME_SOUND_MATCH,
    displayName: "Sound Match",
    tagline: "Drag the right picture into the backpack.",
    glyph: "\u{1F9F0}",
    cardGradient: "from-[#ffc46b] to-[#e08a2c]",
    status: "live",
    route: "/games/sound-match",
    section: "quick-play",
    tags: ["quick-play", "word-games", "listening-games"],
    artKey: "sound-match",
    sessionLength: "1–2 min",
    namespace: GAME_SOUND_MATCH,
  },
  {
    id: GAME_COLOR_SHAPE_HUNT,
    displayName: "Colour & Shape Hunt",
    tagline: "Miss Maya says it. You find it in the scene.",
    glyph: "\u{1F535}",
    cardGradient: "from-[#ff9ecd] to-[#a273e8]",
    status: "live",
    route: "/games/color-shape-hunt",
    section: "quick-play",
    tags: ["quick-play", "listening-games", "language-games"],
    artKey: "color-shape-hunt",
    sessionLength: "1–2 min",
    namespace: GAME_COLOR_SHAPE_HUNT,
  },
  {
    id: GAME_GUESS_THE_SOUND,
    displayName: "Guess the Sound",
    tagline: "Listen hard. Which one made that noise?",
    glyph: "\u{1F50A}",
    cardGradient: "from-[#8fe3c4] to-[#2f9e8c]",
    status: "live",
    route: "/games/guess-the-sound",
    section: "quick-play",
    tags: ["quick-play", "listening-games", "word-games"],
    artKey: "guess-the-sound",
    sessionLength: "1–2 min",
    namespace: GAME_GUESS_THE_SOUND,
  },
  {
    id: GAME_STORY_BUILDER,
    displayName: "Story Builder",
    tagline: "Pick the words, build the sentence, watch it happen.",
    glyph: "\u{1F4D6}",
    cardGradient: "from-[#c3a4ff] to-[#6d3fd4]",
    status: "live",
    route: "/games/story-builder",
    section: "quick-play",
    tags: ["quick-play", "language-games", "word-games"],
    artKey: "story-builder",
    sessionLength: "2–4 min",
    namespace: GAME_STORY_BUILDER,
  },
];

export function listGames(): GameDefinition[] {
  return GAMES;
}

/** Every live game on one library shelf, in registry order. */
export function listGamesInSection(section: GameSection): GameDefinition[] {
  return GAMES.filter((game) => game.section === section);
}

export function getGame(id: GameId): GameDefinition {
  const game = GAMES.find((entry) => entry.id === id);
  if (!game) throw new Error(`Unknown TalkWise Play game: ${id}`);
  return game;
}

/**
 * Placeholder slots shown after the real games so the library reads as "a
 * collection that keeps growing" rather than a fixed set. Deliberately
 * unnamed — inventing fake future titles would be a promise, not a tease.
 *
 * Dropped from two to one now that Quick Play carries six real games: the
 * shelf no longer needs padding to look alive, and every empty card is a
 * card a child can tap and be disappointed by.
 */
export const FUTURE_GAME_SLOTS = 1;
