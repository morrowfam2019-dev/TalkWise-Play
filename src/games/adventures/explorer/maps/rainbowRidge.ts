import type { Collectible, Decoration, Solid } from "../../world/types";
import type { ExplorerMap, RewardProp, SoundStationAnchor } from "./types";

/**
 * MAP 3 — RAINBOW RIDGE. Sound group 3: the tongue-tip sounds /l/ and /s/.
 *
 * The most adventurous of the three, and still a park: coloured platforms
 * and rainbow bridges floating over a soft cloud floor, with a lantern tower
 * to the west and a star deck to the east. Nothing here is dark, spooky or
 * startling.
 *
 * ## The rule that makes "up high" safe for a four-year-old
 *
 * **Nothing is ever more than one 0.95 rise above the surface beside it.**
 * The cloud floor runs unbroken underneath the whole map, every platform
 * sits exactly one rise above it, and the two station decks sit exactly one
 * rise above their own platform. So a child who walks off any edge lands on
 * soft cloud and can climb straight back on with a single jump, from
 * anywhere along that platform's edge — there is no ledge that can strand
 * them and no way to lose. That constraint is verified, not assumed:
 * `npm run verify:world` walks a real controller from spawn to every station
 * and back.
 */

const CLOUD = "#eef6ff";
const CLOUD_EDGE = "#cfe0f2";
const RED = "#ff8f8f";
const ORANGE = "#ffc46a";
const GREEN = "#9fe89f";
const BLUE = "#8fc8ff";
const VIOLET = "#c8a6ff";
const DECK = "#ffffff";
const TOWER = "#ffe9a8";
const STAR_DECK = "#bfe0ff";

const RISE = 0.95;
/** Every platform. */
const T1 = RISE;
/** The two station decks, one rise above their platform. */
const T2 = RISE * 2;

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
    id: `ridge-${solidSeq}`,
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
  // The cloud floor — unbroken, so every fall is a soft landing.
  slab(-52, 52, -52, 52, 0, -10, CLOUD_EDGE, CLOUD),

  // South platform, where you arrive.
  slab(-16, 16, 24, 46, T1, -1, RED, DECK),
  // Rainbow bridge south → centre. Ten units wide.
  slab(-5, 5, 6, 26, T1, -1, ORANGE, DECK),
  // Centre platform, the big open one.
  slab(-22, 22, -14, 8, T1, -1, GREEN, DECK),

  // East run to the star deck.
  slab(20, 44, -10, 2, T1, -1, BLUE, DECK),
  slab(28, 48, -24, -2, T1, -1, BLUE, DECK),
  slab(32, 46, -22, -6, T2, -1, STAR_DECK, DECK),

  // West run to the lantern tower.
  slab(-44, -20, -12, 2, T1, -1, VIOLET, DECK),
  slab(-46, -28, -22, -6, T1, -1, VIOLET, DECK),
  slab(-42, -32, -20, -10, T2, -1, TOWER, DECK),

  // North bridge and the far platform, so the map keeps going past the two
  // stations rather than ending at them.
  slab(-5, 5, -30, -10, T1, -1, ORANGE, DECK),
  slab(-24, 24, -48, -26, T1, -1, VIOLET, DECK),
];

const decorations: Decoration[] = [
  // Cloud banks at floor level and in the air.
  { id: "rc1", kind: "cloud", position: [-46, 1, 44], scale: 3.4 },
  { id: "rc2", kind: "cloud", position: [44, 1, 44], scale: 3.2 },
  { id: "rc3", kind: "cloud", position: [-48, 1, 14], scale: 3.6 },
  { id: "rc4", kind: "cloud", position: [46, 1, 20], scale: 3 },
  { id: "rc5", kind: "cloud", position: [-40, 1, -44], scale: 3.2 },
  { id: "rc6", kind: "cloud", position: [40, 1, -46], scale: 3.4 },
  { id: "rc7", kind: "cloud", position: [-18, 14, 14], scale: 3 },
  { id: "rc8", kind: "cloud", position: [22, 16, -34], scale: 3.4 },
  { id: "rc9", kind: "cloud", position: [0, 18, 40], scale: 3.2 },
  { id: "rc10", kind: "cloud", position: [-34, 13, 30], scale: 2.8 },

  // Crystals mark every step up, so the way on is always visible.
  { id: "rk1", kind: "crystal", position: [-4, T1, 24], scale: 1, color: "#fff3c4" },
  { id: "rk2", kind: "crystal", position: [4, T1, 8], scale: 1, color: "#fff3c4" },
  { id: "rk3", kind: "crystal", position: [-31, T1, -8], scale: 1, color: "#e0d0ff" },
  { id: "rk4", kind: "crystal", position: [-31, T1, -18], scale: 1, color: "#e0d0ff" },
  { id: "rk5", kind: "crystal", position: [30, T1, -8], scale: 1, color: "#cfe8ff" },
  { id: "rk6", kind: "crystal", position: [30, T1, -20], scale: 1, color: "#cfe8ff" },
  { id: "rk7", kind: "crystal", position: [0, T1, -28], scale: 1, color: "#ffd7f0" },

  // Planting on the platforms keeps them reading as parkland, not geometry.
  { id: "rt1", kind: "tree", position: [-13, T1, 42], scale: 1 },
  { id: "rt2", kind: "tree", position: [13, T1, 42], scale: 1 },
  { id: "rt3", kind: "pine", position: [-19, T1, 4], scale: 0.95 },
  { id: "rt4", kind: "pine", position: [19, T1, 4], scale: 0.95 },
  { id: "rt5", kind: "tree", position: [-20, T1, -44], scale: 1.05 },
  { id: "rt6", kind: "tree", position: [20, T1, -44], scale: 1.05 },
  { id: "rt7", kind: "pine", position: [45, T1, -4], scale: 0.9 },
  { id: "rt8", kind: "pine", position: [-44, T1, -8], scale: 0.9 },

  { id: "rf1", kind: "flower", position: [-8, T1, 34], scale: 1, color: "#ff6f91" },
  { id: "rf2", kind: "flower", position: [8, T1, 34], scale: 1, color: "#ffe066" },
  { id: "rf3", kind: "flower", position: [-14, T1, -8], scale: 1, color: "#c78bff" },
  { id: "rf4", kind: "flower", position: [14, T1, -8], scale: 1, color: "#7fd8ff" },
  { id: "rf5", kind: "flower", position: [0, T1, -42], scale: 1, color: "#ffb347" },

  { id: "rr1", kind: "rock", position: [-40, T2, -18], scale: 0.8 },
  { id: "rr2", kind: "rock", position: [44, T2, -20], scale: 0.85 },
];

const collectibles: Collectible[] = [
  { id: "rc-1", position: [0, T1 + 1, 40], value: 2 },
  { id: "rc-2", position: [0, T1 + 1, 30], value: 2 },
  { id: "rc-3", position: [0, T1 + 1, 20], value: 2 },
  { id: "rc-4", position: [0, T1 + 1, 10], value: 2 },
  { id: "rc-5", position: [0, T1 + 1, 0], value: 3 },
  { id: "rc-6", position: [-12, T1 + 1, -6], value: 2 },
  { id: "rc-7", position: [-26, T1 + 1, -6], value: 3 },
  { id: "rc-8", position: [-36, T1 + 1, -8], value: 3 },
  { id: "rc-9", position: [-37, T2 + 1, -15], value: 5 },
  { id: "rc-10", position: [12, T1 + 1, -6], value: 2 },
  { id: "rc-11", position: [26, T1 + 1, -6], value: 3 },
  { id: "rc-12", position: [36, T1 + 1, -4], value: 3 },
  { id: "rc-13", position: [39, T2 + 1, -14], value: 5 },
  { id: "rc-14", position: [0, T1 + 1, -20], value: 2 },
  { id: "rc-15", position: [-14, T1 + 1, -38], value: 3 },
  { id: "rc-16", position: [14, T1 + 1, -38], value: 3 },
  { id: "rc-17", position: [-40, 1, 30], value: 3 },
  { id: "rc-18", position: [40, 1, 34], value: 3 },
];

const stations: SoundStationAnchor[] = [
  {
    id: "ridge-lantern-tower",
    soundId: "l",
    position: [-37, T2, -15],
    place: "The Lantern Tower",
    activates: [
      "lantern-lt-1",
      "lantern-lt-2",
      "lantern-lt-3",
      "starpost-lt",
      "archway-lt",
    ],
  },
  {
    id: "ridge-star-deck",
    soundId: "s",
    position: [39, T2, -14],
    place: "The Star Deck",
    activates: [
      "starpost-sd-1",
      "starpost-sd-2",
      "starpost-sd-3",
      "fountain-sd",
      "pinwheel-sd",
    ],
  },
];

const rewardProps: RewardProp[] = [
  // /l/ — the whole west tower lights.
  { id: "lantern-lt-1", kind: "lantern", position: [-41, T2, -11], color: "#ffd76a" },
  { id: "lantern-lt-2", kind: "lantern", position: [-33, T2, -11], color: "#ffd76a" },
  { id: "lantern-lt-3", kind: "lantern", position: [-41, T2, -19], color: "#ffd76a" },
  { id: "starpost-lt", kind: "starpost", position: [-45, T1, -14], color: "#ffe9a8" },
  { id: "archway-lt", kind: "archway", position: [-30, T1, -14], color: "#c8a6ff" },

  // /s/ — stars come out over the east deck.
  { id: "starpost-sd-1", kind: "starpost", position: [34, T2, -20], color: "#cfe8ff" },
  { id: "starpost-sd-2", kind: "starpost", position: [44, T2, -20], color: "#cfe8ff" },
  { id: "starpost-sd-3", kind: "starpost", position: [44, T2, -8], color: "#cfe8ff" },
  { id: "fountain-sd", kind: "fountain", position: [30, T1, -14], color: "#8fe6ff" },
  { id: "pinwheel-sd", kind: "pinwheel", position: [24, T1, -6], color: "#ffd7f0" },
];

export const rainbowRidge: ExplorerMap = {
  id: "rainbow-ridge",
  groupId: "group3",
  title: "Rainbow Ridge",
  blurb: "Cross the rainbow bridges to the lantern tower and the star deck.",
  glyph: "🌈",
  cardGradient: "from-[#a88bff] to-[#5b3fd6]",
  spawn: [0, T1, 42],
  spawnYaw: 0,
  bounds: { minX: -52, maxX: 52, minZ: -52, maxZ: 52 },
  solids,
  decorations,
  collectibles,
  stations,
  rewardProps,
  skyColor: "#bcd8ff",
  fogColor: "#e6eeff",
  waterColor: "#9fc4ee",
  waterLevel: -4,
  killPlane: -14,
};
