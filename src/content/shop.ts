/**
 * Shop catalogue.
 *
 * Pure data, like the speech content — adding an item is a new entry here,
 * never new rendering or economy code.
 *
 * The hard rule this file exists to keep visible: **nothing purchasable may
 * touch the speech check.** Boosts change how a player *moves* through a
 * world (faster, higher); they never shorten a word list, skip an attempt,
 * or make the microphone easier to satisfy. A child in Speed Shoes still has
 * to actually say BANANA.
 */

export type ShopKind = "character" | "aura" | "boost" | "hat";

export interface ShopItem {
  id: string;
  kind: ShopKind;
  name: string;
  /** One line a child can read, describing what they get. */
  blurb: string;
  /** Cost in coins. Zero means it's owned from the start. */
  price: number;
}

/** Palette and silhouette for a playable character. */
export interface CharacterLook {
  skin: string;
  skinDark: string;
  belly: string;
  limb: string;
  boot: string;
  cheek: string;
  /** What sits on top of the head. */
  crest: "antenna" | "ears" | "halo" | "leaf" | "curls";
}

export interface CharacterItem extends ShopItem {
  kind: "character";
  look: CharacterLook;
}

export interface AuraItem extends ShopItem {
  kind: "aura";
  color: string;
  /** How the ring behaves underfoot. */
  style: "ring" | "sparkle" | "orbit";
}

export interface BoostItem extends ShopItem {
  kind: "boost";
  /** Multiplier on jump velocity. 1 leaves jumping untouched. */
  jump: number;
  /** Multiplier on walking speed. 1 leaves speed untouched. */
  speed: number;
}

/** A cosmetic hat, worn on top of whichever character is equipped. Purely
 * visual — see the file-level rule: nothing purchasable touches the speech
 * check, and a hat is even further from that line than a boost is. */
export interface HatItem extends ShopItem {
  kind: "hat";
  style: "speedster" | "webbed" | "caped";
  primary: string;
  secondary: string;
}

export const CHARACTERS: CharacterItem[] = [
  {
    id: "milo",
    kind: "character",
    name: "Milo",
    blurb: "The original TalkWise explorer.",
    price: 0,
    look: {
      skin: "#35cfc0",
      skinDark: "#22b3a6",
      belly: "#fff3d8",
      limb: "#2f7fd4",
      boot: "#f5c33b",
      cheek: "#ff9ec4",
      crest: "antenna",
    },
  },
  {
    id: "pip",
    kind: "character",
    name: "Pip",
    blurb: "Sunny, round-eared, always first up the hill.",
    price: 120,
    look: {
      skin: "#ff9f4a",
      skinDark: "#e07f2c",
      belly: "#fff0dc",
      limb: "#c2571f",
      boot: "#ffd76a",
      cheek: "#ff7a9c",
      crest: "ears",
    },
  },
  {
    id: "nova",
    kind: "character",
    name: "Nova",
    blurb: "Stargazer with a ring that never stops glowing.",
    price: 200,
    look: {
      skin: "#9b7ff0",
      skinDark: "#7a5fd0",
      belly: "#efe8ff",
      limb: "#4b3a94",
      boot: "#ffd76a",
      cheek: "#ffa6e0",
      crest: "halo",
    },
  },
  {
    id: "sprout",
    kind: "character",
    name: "Sprout",
    blurb: "Grew up in the woods. Talks to the trees.",
    price: 200,
    look: {
      skin: "#6fd36b",
      skinDark: "#4faa4c",
      belly: "#f2ffe8",
      limb: "#2f7a3f",
      boot: "#c58a55",
      cheek: "#ffb0b0",
      crest: "leaf",
    },
  },
  {
    id: "tj",
    kind: "character",
    name: "TJ",
    blurb: "TalkWise's own crew captain, hoodie and all. A big unlock!",
    price: 1200,
    look: {
      skin: "#a9744f",
      skinDark: "#8a5c3d",
      belly: "#141a3d",
      limb: "#1c2454",
      boot: "#f5c33b",
      cheek: "#ff9ec4",
      crest: "curls",
    },
  },
];

export const AURAS: AuraItem[] = [
  {
    id: "aura-sunbeam",
    kind: "aura",
    name: "Sunbeam",
    blurb: "A warm golden ring that follows your feet.",
    price: 60,
    color: "#f5c33b",
    style: "ring",
  },
  {
    id: "aura-bubbles",
    kind: "aura",
    name: "Bubble Trail",
    blurb: "Little bubbles drift up around you.",
    price: 80,
    color: "#5ecbe8",
    style: "sparkle",
  },
  {
    id: "aura-comet",
    kind: "aura",
    name: "Comet",
    blurb: "Three sparks orbit you like tiny planets.",
    price: 140,
    color: "#c98fd0",
    style: "orbit",
  },
];

/**
 * Boost multipliers are stored as 1 + bonus. Every bonus here is 2x what it
 * used to be (0.22 -> 0.44, 0.28 -> 0.56, 0.18 -> 0.36) so a boost is a move
 * a child can actually feel, not a rounding error.
 */
export const BOOSTS: BoostItem[] = [
  {
    id: "boost-boots",
    kind: "boost",
    name: "Super Boots",
    blurb: "Jump much higher. (Jump adventures only.)",
    price: 100,
    jump: 1.44,
    speed: 1,
  },
  {
    id: "boost-shoes",
    kind: "boost",
    name: "Speed Shoes",
    blurb: "Run a lot faster everywhere.",
    price: 100,
    jump: 1,
    speed: 1.56,
  },
  {
    id: "boost-both",
    kind: "boost",
    name: "Sky Sneakers",
    blurb: "Faster and higher, all at once.",
    price: 260,
    jump: 1.36,
    speed: 1.36,
  },
];

/**
 * Hero-styled hats. Original silhouettes and names built to evoke the
 * speedster / web-slinger / caped-hero archetypes a kid asks for by their
 * trademarked names — not likenesses of any of them. No franchise name,
 * logo, or exact costume design appears anywhere in the game or its assets.
 */
export const HATS: HatItem[] = [
  {
    id: "hat-blaze",
    kind: "hat",
    name: "Blaze Runner",
    blurb: "A streak of speed-blue with a lightning bolt up front.",
    price: 180,
    style: "speedster",
    primary: "#2f6fe4",
    secondary: "#ffd23b",
  },
  {
    id: "hat-web",
    kind: "hat",
    name: "Web Slinger",
    blurb: "A red-and-blue mask webbed all over.",
    price: 220,
    style: "webbed",
    primary: "#e5342f",
    secondary: "#2f6fe4",
  },
  {
    id: "hat-sky",
    kind: "hat",
    name: "Sky Guardian",
    blurb: "A caped cowl with a bold chest emblem and a flowing cape.",
    price: 260,
    style: "caped",
    primary: "#2f6fe4",
    secondary: "#e5342f",
  },
];

/** The character every player starts with, free and always owned. */
export const DEFAULT_CHARACTER_ID = "milo";

export function getCharacter(id: string): CharacterItem {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

export function getAura(id: string | null): AuraItem | null {
  if (!id) return null;
  return AURAS.find((a) => a.id === id) ?? null;
}

export function getBoost(id: string | null): BoostItem | null {
  if (!id) return null;
  return BOOSTS.find((b) => b.id === id) ?? null;
}

export function getHat(id: string | null): HatItem | null {
  if (!id) return null;
  return HATS.find((h) => h.id === id) ?? null;
}

export function getShopItem(id: string): ShopItem | undefined {
  return [...CHARACTERS, ...AURAS, ...BOOSTS, ...HATS].find(
    (item) => item.id === id,
  );
}
