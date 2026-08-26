import type { Collectible, Decoration, JumpPad, Solid } from "../../world/types";
import type {
  ExplorerMap,
  RewardProp,
  SoundStationAnchor,
  ToyBalloon,
} from "./types";

/**
 * SOUND ISLAND — every Beginner station in one world.
 *
 * Founder feedback after the three-map version: splitting the seven sounds
 * across three separate worlds meant re-entering a menu to move between
 * sound groups, and there was nothing to do in a map except find its
 * stations. This is the replacement — one big island, laid out as a cross,
 * with a play hub at the centre a child passes through no matter which wing
 * they are headed to.
 *
 * ## Layout
 *
 * A south spine leads in from spawn to the **Play Hub** (slides, a balloon
 * patch, and a house with a bouncy bed inside — nothing here is gated
 * behind speech, it is just there to enjoy). From the hub, three more spines
 * lead out to the sound wings: **west** for the lip sounds (/m/ /b/ /p/),
 * **east** for the air sounds (/w/ /f/), and **north** for the tongue-tip
 * sounds (/l/ /s/). The tongue-tip wing was floating platforms in the old
 * three-map version; here it is ground level like the rest of the island,
 * since one continuous ground plane is both simpler to build correctly and
 * safer for the youngest players than mixing a cloud-platform biome into a
 * single map.
 *
 * Same promises as every Beginner map: one continuous ground plane, no
 * pits, no hazard water, and the only two places that ask for a jump — the
 * picnic deck and the two slide hills — are pure play, never a station a
 * child could be locked out of.
 */

const GRASS = "#7fdc6f";
const GRASS_DARK = "#5fc45c";
const HUB_GRASS = "#9be870";
const HUB_GRASS_DARK = "#7fd158";
const PATH = "#f0d9a8";
const PATH_EDGE = "#e0c48c";
const COURT = "#f2a35e";
const DECK = "#c98a55";
const DECK_TOP = "#e0a86a";
const HILL = "#8fe07e";
const HILL_DARK = "#5fc45c";
const HILL_B = "#8fd0ff";
const HILL_B_DARK = "#5fa8e0";
const CREEK = "#7fd0e8";
const CREEK_BED = "#a8c9d6";
const PLANK = "#b07f4e";
const PLANK_TOP = "#cf9a63";
const GARDEN = "#9ce07f";
const TOWER = "#ffe9a8";
const TOWER_DEEP = "#e0c46a";
const STAR_DECK = "#c7e6ff";
const STAR_DECK_DEEP = "#7fb6ea";
const DIRT = "#7a9a5a";

const STEP = 0.3;
const RISE = 0.95;

let solidSeq = 0;
function slab(
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  top: number,
  bottom: number,
  color: string,
  capColor?: string,
): Solid {
  solidSeq += 1;
  return {
    id: `isl-${solidSeq}`,
    minX,
    maxX,
    minZ,
    maxZ,
    top,
    bottom,
    color,
    capColor,
  };
}

const solids: Solid[] = [
  // One continuous base under the whole island — nothing here can drop
  // anyone, whichever wing they wander into.
  slab(-62, 62, -62, 62, 0, -10, DIRT, GRASS),

  // --- Spines, radiating from the hub -------------------------------------
  slab(-4, 4, 18, 60, 0.06, -1, PATH_EDGE, PATH), // south, spawn -> hub
  slab(-58, -20, -3, 3, 0.06, -1, PATH_EDGE, PATH), // west, hub -> lip wing
  slab(20, 58, -3, 3, 0.06, -1, PATH_EDGE, PATH), // east, hub -> air wing
  slab(-4, 4, -56, -18, 0.06, -1, PATH_EDGE, PATH), // north, hub -> tongue-tip wing

  // --- The Play Hub --------------------------------------------------------
  slab(-20, 20, -18, 18, 0.04, -1, HUB_GRASS_DARK, HUB_GRASS),

  // Slide Hill (west) — three easy terraces up, then a long grass run back
  // down the far side. Pure play; no station sits up here.
  slab(-18, -6, 2, 8, RISE, -1, HILL_DARK, HILL),
  slab(-16, -8, 8, 13, RISE * 2, -1, HILL_DARK, HILL),
  slab(-14, -10, 13, 17, RISE * 3, -1, HILL_DARK, HILL),

  // Slide Hill (east) — same idea, a different colourway so the two read as
  // twins rather than duplicates.
  slab(6, 18, 2, 8, RISE, -1, HILL_B_DARK, HILL_B),
  slab(8, 16, 8, 13, RISE * 2, -1, HILL_B_DARK, HILL_B),
  slab(10, 14, 13, 17, RISE * 3, -1, HILL_B_DARK, HILL_B),

  // The house's floor — a flat pad between the two hills, flush with the
  // hub grass, so nothing about walking in or out needs a jump.
  slab(-7, 7, -12, -3, 0.06, -1, HUB_GRASS_DARK, HUB_GRASS),

  // --- LIP SOUNDS wing (west): /m/ swings, /b/ court, /p/ picnic deck -----
  slab(-44, -28, -20, -4, 0.08, -1, GRASS_DARK, GRASS), // Swings
  slab(-44, -28, 4, 20, 0.08, -1, COURT, COURT), // Ball Court
  slab(-47, -45, -13, 7, STEP / 2 + 0.08, -1, DECK, DECK_TOP), // Picnic step
  slab(-60, -46, -14, 6, RISE, -1, DECK, DECK_TOP), // Picnic Deck

  // --- AIR SOUNDS wing (east): /w/ creek bridge, /f/ fern garden ----------
  slab(20, 58, -14, -10, -0.4, -10, CREEK_BED, CREEK), // Creek channel
  slab(29, 35, -15, -14, STEP, -1, PLANK, PLANK_TOP), // Bridge ramp, north end
  slab(29, 35, -10, -9, STEP, -1, PLANK, PLANK_TOP), // Bridge ramp, south end
  slab(29, 35, -14, -10, RISE, -3, PLANK, PLANK_TOP), // Bridge deck
  slab(40, 58, 4, 20, 0.08, -1, GARDEN, GARDEN), // Fern Garden

  // --- TONGUE-TIP SOUNDS wing (north): /l/ tower, /s/ star deck -----------
  slab(-36, 36, -30, -18, 0.06, -1, PATH_EDGE, PATH), // connective plaza
  slab(-36, -12, -50, -30, 0.08, -1, TOWER_DEEP, TOWER), // Lantern Tower
  slab(12, 36, -50, -30, 0.08, -1, STAR_DECK_DEEP, STAR_DECK), // Star Deck
];

const decorations: Decoration[] = [
  // Boundary planting, all the way round the island.
  { id: "bt1", kind: "tree", position: [-58, 0, 58], scale: 1.2 },
  { id: "bt2", kind: "pine", position: [-38, 0, 60], scale: 1.1 },
  { id: "bt3", kind: "tree", position: [-16, 0, 61], scale: 1.15 },
  { id: "bt4", kind: "pine", position: [16, 0, 61], scale: 1.05 },
  { id: "bt5", kind: "tree", position: [38, 0, 60], scale: 1.2 },
  { id: "bt6", kind: "pine", position: [58, 0, 58], scale: 1.1 },
  { id: "bt7", kind: "tree", position: [61, 0, 34], scale: 1.15 },
  { id: "bt8", kind: "pine", position: [61, 0, 8], scale: 1 },
  { id: "bt9", kind: "tree", position: [61, 0, -18], scale: 1.1 },
  { id: "bt10", kind: "pine", position: [58, 0, -42], scale: 1.15 },
  { id: "bt11", kind: "tree", position: [36, 0, -60], scale: 1.05 },
  { id: "bt12", kind: "pine", position: [10, 0, -61], scale: 1.2 },
  { id: "bt13", kind: "tree", position: [-14, 0, -61], scale: 1.1 },
  { id: "bt14", kind: "pine", position: [-38, 0, -60], scale: 1.15 },
  { id: "bt15", kind: "tree", position: [-58, 0, -42], scale: 1.05 },
  { id: "bt16", kind: "pine", position: [-61, 0, -18], scale: 1.1 },
  { id: "bt17", kind: "tree", position: [-61, 0, 8], scale: 1.15 },
  { id: "bt18", kind: "pine", position: [-61, 0, 34], scale: 1.2 },

  // Hub — flowers around the plaza edge, clouds overhead.
  { id: "hb1", kind: "flower", position: [-17, 0.04, -15], scale: 1, color: "#ff6f91" },
  { id: "hb2", kind: "flower", position: [17, 0.04, -15], scale: 1, color: "#ffe066" },
  { id: "hb3", kind: "flower", position: [-17, 0.04, 15], scale: 1, color: "#7fd8ff" },
  { id: "hb4", kind: "flower", position: [17, 0.04, 15], scale: 1, color: "#c78bff" },
  { id: "hb5", kind: "crystal", position: [-19, RISE * 3, 15], scale: 1, color: "#fff3c4" },
  { id: "hb6", kind: "crystal", position: [19, RISE * 3, 15], scale: 1, color: "#cfe8ff" },
  { id: "cl1", kind: "cloud", position: [-10, 20, 4], scale: 3.2 },
  { id: "cl2", kind: "cloud", position: [12, 22, 6], scale: 3 },
  { id: "cl3", kind: "cloud", position: [0, 24, -30], scale: 3.4 },
  { id: "cl4", kind: "cloud", position: [-36, 20, 30], scale: 3 },
  { id: "cl5", kind: "cloud", position: [36, 21, 30], scale: 3.2 },
  { id: "cl6", kind: "cloud", position: [0, 18, 44], scale: 3.4 },

  // The house and its bouncy bed. Door faces south, toward the spawn spine,
  // so a child walking in from spawn sees the doorway first.
  { id: "house-1", kind: "house", position: [0, 0.06, -8], scale: 1.4 },
  { id: "bed-1", kind: "bed", position: [0, 0.06, -9.2], scale: 1 },

  // --- LIP SOUNDS wing planting --------------------------------------------
  { id: "sw1", kind: "tree", position: [-46, 0.08, -14], scale: 1.05 },
  { id: "sw2", kind: "tree", position: [-42, 0.08, -18], scale: 0.9 },
  { id: "bc1", kind: "rock", position: [-30, 0.08, 6], scale: 0.75 },
  { id: "bc2", kind: "rock", position: [-42, 0.08, 18], scale: 0.7 },
  { id: "pd1", kind: "tree", position: [-56, RISE, -12], scale: 1 },
  { id: "pd2", kind: "flower", position: [-52, RISE, 4], scale: 1, color: "#ff6f91" },
  { id: "pd3", kind: "flower", position: [-58, RISE, -4], scale: 1, color: "#ffb347" },
  { id: "lf1", kind: "flower", position: [-34, 0.08, -8], scale: 1, color: "#ffe066" },
  { id: "lf2", kind: "flower", position: [-32, 0.08, 16], scale: 1, color: "#ff6f91" },

  // --- AIR SOUNDS wing planting ---------------------------------------------
  { id: "cr1", kind: "rock", position: [24, -0.4, -12], scale: 0.85 },
  { id: "cr2", kind: "rock", position: [50, -0.4, -12], scale: 0.9 },
  { id: "wb1", kind: "pine", position: [26, -0.35, -17], scale: 1 },
  { id: "wb2", kind: "pine", position: [40, -0.35, -8], scale: 1.05 },
  { id: "gd1", kind: "flower", position: [45, 0.08, 8], scale: 1, color: "#ff6f91" },
  { id: "gd2", kind: "flower", position: [53, 0.08, 16], scale: 1, color: "#ffe066" },
  { id: "gd3", kind: "flower", position: [48, 0.08, 18], scale: 1, color: "#c78bff" },
  { id: "gd4", kind: "rock", position: [56, 0.08, 6], scale: 0.85 },

  // --- TONGUE-TIP SOUNDS wing planting --------------------------------------
  { id: "lt1", kind: "pine", position: [-30, 0.08, -46], scale: 1.1 },
  { id: "lt2", kind: "crystal", position: [-18, 0.08, -34], scale: 1, color: "#ffe9a8" },
  { id: "lt3", kind: "flower", position: [-28, 0.08, -34], scale: 1, color: "#ffb347" },
  { id: "sd1", kind: "pine", position: [30, 0.08, -46], scale: 1.1 },
  { id: "sd2", kind: "crystal", position: [22, 0.08, -34], scale: 1, color: "#cfe8ff" },
  { id: "sd3", kind: "flower", position: [30, 0.08, -34], scale: 1, color: "#7fd8ff" },
];

/** Coins line every spine and wing, so following them is also how a child
 * finds the next thing to talk to (or the next thing to jump on). */
const collectibles: Collectible[] = [
  // South spine.
  { id: "c-1", position: [0, 1, 52], value: 2 },
  { id: "c-2", position: [0, 1, 44], value: 2 },
  { id: "c-3", position: [0, 1, 36], value: 2 },
  { id: "c-4", position: [0, 1, 28], value: 2 },
  { id: "c-5", position: [0, 1, 21], value: 2 },
  // Hub.
  { id: "c-6", position: [-13, 1, -10], value: 2 },
  { id: "c-7", position: [13, 1, -10], value: 2 },
  { id: "c-8", position: [-12, RISE + 1, 4], value: 2 },
  { id: "c-9", position: [-12, RISE * 3 + 1, 15], value: 5 },
  { id: "c-10", position: [12, RISE + 1, 4], value: 2 },
  { id: "c-11", position: [12, RISE * 3 + 1, 15], value: 5 },
  { id: "c-12", position: [0, 1, -6], value: 3 },
  // West spine + Lip wing.
  { id: "c-13", position: [-12, 1, 0], value: 2 },
  { id: "c-14", position: [-24, 1, 0], value: 2 },
  { id: "c-15", position: [-36, 1.1, -12], value: 2 },
  { id: "c-16", position: [-38, 1.1, -6], value: 2 },
  { id: "c-17", position: [-36, 1.1, 12], value: 2 },
  { id: "c-18", position: [-38, 1.1, 6], value: 2 },
  { id: "c-19", position: [-52, RISE + 1, -2], value: 3 },
  { id: "c-20", position: [-52, RISE + 1, 2], value: 2 },
  // East spine + Air wing.
  { id: "c-21", position: [12, 1, 0], value: 2 },
  { id: "c-22", position: [24, 1, 0], value: 2 },
  { id: "c-23", position: [32, RISE + 1, -12], value: 3 },
  { id: "c-24", position: [46, 0.9, 12], value: 2 },
  { id: "c-25", position: [50, 0.9, 16], value: 2 },
  { id: "c-26", position: [54, 0.9, 8], value: 2 },
  // North spine + Tongue-tip wing.
  { id: "c-27", position: [0, 1, -24], value: 2 },
  { id: "c-28", position: [0, 1, -30], value: 2 },
  { id: "c-29", position: [-20, 0.9, -40], value: 3 },
  { id: "c-30", position: [-24, 0.9, -36], value: 2 },
  { id: "c-31", position: [20, 0.9, -40], value: 3 },
  { id: "c-32", position: [24, 0.9, -36], value: 2 },
];

const stations: SoundStationAnchor[] = [
  {
    id: "isl-swings",
    soundId: "m",
    position: [-36, 0.08, -12],
    place: "The Swings",
    activates: ["lantern-sw-1", "lantern-sw-2", "lantern-sw-3", "pinwheel-sw"],
  },
  {
    id: "isl-court",
    soundId: "b",
    position: [-36, 0.08, 12],
    place: "The Ball Court",
    activates: ["starpost-bc-1", "starpost-bc-2", "starpost-bc-3", "fountain-bc"],
  },
  {
    id: "isl-picnic",
    soundId: "p",
    position: [-53, RISE, -4],
    place: "The Picnic Deck",
    activates: ["balloon-pd-1", "balloon-pd-2", "balloon-pd-3", "balloon-pd-4", "archway-pd"],
  },
  {
    id: "isl-bridge",
    soundId: "w",
    position: [32, RISE, -12],
    place: "The Creek Bridge",
    activates: ["lantern-br-1", "lantern-br-2", "fountain-br", "pinwheel-br"],
  },
  {
    id: "isl-garden",
    soundId: "f",
    position: [49, 0.08, 12],
    place: "The Fern Garden",
    activates: ["lantern-gd-1", "lantern-gd-2", "starpost-gd", "archway-gd"],
  },
  {
    id: "isl-tower",
    soundId: "l",
    position: [-24, 0.08, -40],
    place: "The Lantern Tower",
    activates: ["lantern-lt-1", "lantern-lt-2", "lantern-lt-3", "starpost-lt", "archway-lt"],
  },
  {
    id: "isl-star-deck",
    soundId: "s",
    position: [24, 0.08, -40],
    place: "The Star Deck",
    activates: ["starpost-sd-1", "starpost-sd-2", "starpost-sd-3", "fountain-sd", "pinwheel-sd"],
  },
];

const rewardProps: RewardProp[] = [
  // /m/ — the swings.
  { id: "lantern-sw-1", kind: "lantern", position: [-42, 0.08, -8], color: "#ffd76a" },
  { id: "lantern-sw-2", kind: "lantern", position: [-36, 0.08, -4], color: "#ffd76a" },
  { id: "lantern-sw-3", kind: "lantern", position: [-30, 0.08, -8], color: "#ffd76a" },
  { id: "pinwheel-sw", kind: "pinwheel", position: [-36, 0.08, -18], color: "#ff8fb1" },

  // /b/ — the court.
  { id: "starpost-bc-1", kind: "starpost", position: [-42, 0.08, 8], color: "#7fd8ff" },
  { id: "starpost-bc-2", kind: "starpost", position: [-30, 0.08, 8], color: "#7fd8ff" },
  { id: "starpost-bc-3", kind: "starpost", position: [-36, 0.08, 18], color: "#7fd8ff" },
  { id: "fountain-bc", kind: "fountain", position: [-36, 0.08, 4], color: "#8fe6ff" },

  // /p/ — the picnic deck.
  { id: "balloon-pd-1", kind: "balloon", position: [-58, RISE, -10], color: "#ff6f91" },
  { id: "balloon-pd-2", kind: "balloon", position: [-50, RISE, -10], color: "#ffe066" },
  { id: "balloon-pd-3", kind: "balloon", position: [-58, RISE, 2], color: "#7fd8ff" },
  { id: "balloon-pd-4", kind: "balloon", position: [-50, RISE, 2], color: "#c78bff" },
  { id: "archway-pd", kind: "archway", position: [-46, RISE, -4], color: "#ffd76a" },

  // /w/ — the creek bridge.
  { id: "lantern-br-1", kind: "lantern", position: [29, RISE, -12], color: "#8fe6ff" },
  { id: "lantern-br-2", kind: "lantern", position: [35, RISE, -12], color: "#8fe6ff" },
  { id: "fountain-br", kind: "fountain", position: [24, -0.4, -12], color: "#8fe6ff" },
  { id: "pinwheel-br", kind: "pinwheel", position: [32, STEP, -16], color: "#7fd8ff" },

  // /f/ — the fern garden.
  { id: "lantern-gd-1", kind: "lantern", position: [44, 0.08, 6], color: "#ffd76a" },
  { id: "lantern-gd-2", kind: "lantern", position: [56, 0.08, 18], color: "#ffd76a" },
  { id: "starpost-gd", kind: "starpost", position: [50, 0.08, 18], color: "#a8ff9f" },
  { id: "archway-gd", kind: "archway", position: [41, 0.08, 12], color: "#a8ff9f" },

  // /l/ — the lantern tower.
  { id: "lantern-lt-1", kind: "lantern", position: [-30, 0.08, -36], color: "#ffd76a" },
  { id: "lantern-lt-2", kind: "lantern", position: [-18, 0.08, -36], color: "#ffd76a" },
  { id: "lantern-lt-3", kind: "lantern", position: [-24, 0.08, -46], color: "#ffd76a" },
  { id: "starpost-lt", kind: "starpost", position: [-14, 0.08, -40], color: "#ffe9a8" },
  { id: "archway-lt", kind: "archway", position: [-24, 0.08, -32], color: "#c8a6ff" },

  // /s/ — the star deck.
  { id: "starpost-sd-1", kind: "starpost", position: [18, 0.08, -36], color: "#cfe8ff" },
  { id: "starpost-sd-2", kind: "starpost", position: [30, 0.08, -36], color: "#cfe8ff" },
  { id: "starpost-sd-3", kind: "starpost", position: [24, 0.08, -46], color: "#cfe8ff" },
  { id: "fountain-sd", kind: "fountain", position: [34, 0.08, -40], color: "#8fe6ff" },
  { id: "pinwheel-sd", kind: "pinwheel", position: [14, 0.08, -40], color: "#ffd7f0" },
];

/** Free-standing balloons, poppable from the very first visit — a little
 * patch of them in the hub, and a few more strung along the south spine so
 * the very first steps into the island already have something playful. */
const toyBalloons: ToyBalloon[] = [
  { id: "toy-b1", position: [-2, 0.04, 6], color: "#ff6f91" },
  { id: "toy-b2", position: [2, 0.04, 8], color: "#ffe066" },
  { id: "toy-b3", position: [-3, 0.04, 11], color: "#7fd8ff" },
  { id: "toy-b4", position: [3, 0.04, 13], color: "#c78bff" },
  { id: "toy-b5", position: [0, 0.04, 15], color: "#ffb347" },
  { id: "toy-b6", position: [-1, 0.06, 30], color: "#ff8fb1" },
  { id: "toy-b7", position: [1.5, 0.06, 38], color: "#8fe6ff" },
  { id: "toy-b8", position: [-1.5, 0.06, 46], color: "#ffe066" },
];

/** The bouncy bed's actual physics — a hidden jump pad under the mattress
 * decoration, so it launches the player without looking like a launch pad. */
const jumpPads: JumpPad[] = [
  { id: "bed-bounce", position: [0, 0.06, -9.2], radius: 1.7, boost: 9, hidden: true },
];

export const soundIsland: ExplorerMap = {
  id: "sound-island",
  title: "Sound Island",
  blurb: "One big world with all seven sounds — plus slides, balloons and a bouncy-bed house.",
  glyph: "🏝️",
  cardGradient: "from-[#8fe07e] to-[#2f9fd6]",
  spawn: [0, 0.06, 56],
  spawnYaw: 0,
  bounds: { minX: -62, maxX: 62, minZ: -62, maxZ: 62 },
  solids,
  decorations,
  collectibles,
  stations,
  rewardProps,
  toyBalloons,
  jumpPads,
  skyColor: "#8fd8f5",
  fogColor: "#d8f2fd",
  waterColor: "#5fc4ec",
  waterLevel: -3,
  killPlane: -14,
};
